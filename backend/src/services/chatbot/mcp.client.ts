import { GoogleGenerativeAI, GenerativeModel, FunctionDeclaration } from '@google/generative-ai';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING;

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set');
}

if (!MONGODB_CONNECTION_STRING) {
  throw new Error('MONGODB_CONNECTION_STRING is not set');
}

export class MCPClient {
  private mcp: Client;
  private model!: GenerativeModel;
  private genAI: GoogleGenerativeAI;
  private tools: FunctionDeclaration[] = [];
  private transport: StdioClientTransport | null = null;
  private isConnected: boolean = false;

  constructor() {
    this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY as string);
    this.mcp = new Client({ name: 'mcp-client-cli', version: '1.0.0' });
  }

  async connect() {
    try {
      const mongoUri = process.env.MONGODB_CONNECTION_STRING;
      if (!mongoUri) {
        throw new Error('MONGODB_URI is not set in environment');
      }

      this.transport = new StdioClientTransport({
        command: 'npx',
        args: ['-y', 'mongodb-mcp-server', '--connectionString', mongoUri],
      });

      await this.mcp.connect(this.transport);

      const toolsResult = await this.mcp.listTools();

      // Convert MCP tools to Gemini FunctionDeclarations
      this.tools = toolsResult.tools.map((tool: any) => ({
        name: tool.name,
        description: tool.description || '',
        parameters: this.cleanSchema(tool.inputSchema), // Clean the schema for Gemini
      }));

      console.log(
        'Connected to Mongo MCP Server with tools:',
        this.tools.map((t) => `${t.name}: ${t.description}`).join('\n')
      );

      this.isConnected = true;
    } catch (e) {
      console.error('Failed to connect to MongoDB MCP server:', e);
      throw e;
    }
  }

  private cleanSchema(schema: any): any {
    if (!schema || typeof schema !== 'object') {
      return schema;
    }

    // Create a clean copy without unsupported fields
    const cleanedSchema = { ...schema };

    // Remove all unsupported JSON Schema fields
    const unsupportedFields = [
      'additionalProperties',
      '$schema',
      '$id',
      '$ref',
      'definitions',
      'title',
      'const', // Not supported by Gemini
      'examples', // Not supported
      'default', // Can cause issues
      'format', // Not always supported
      'pattern', // Regex patterns not supported
      'minLength', // String constraints
      'maxLength',
      'minimum', // Number constraints
      'maximum',
      'exclusiveMinimum',
      'exclusiveMaximum',
      'multipleOf',
      'minItems', // Array constraints
      'maxItems',
      'uniqueItems',
      'minProperties', // Object constraints
      'maxProperties',
      'patternProperties',
      'dependencies',
      'if', // Conditional schemas
      'then',
      'else',
      'not', // Schema negation
      'readOnly', // Metadata
      'writeOnly',
      'deprecated',
    ];

    // Remove unsupported fields
    unsupportedFields.forEach((field) => {
      delete cleanedSchema[field];
    });

    // Convert anyOf/oneOf to simpler structure if possible
    if (cleanedSchema.anyOf && Array.isArray(cleanedSchema.anyOf)) {
      // Try to simplify anyOf - if all items have the same type, just use that type
      const types = cleanedSchema.anyOf.map((item: any) => item.type).filter(Boolean);
      if (types.length > 0 && types.every((t: string) => t === types[0])) {
        cleanedSchema.type = types[0];
        delete cleanedSchema.anyOf;
      } else {
        // Clean each anyOf item
        cleanedSchema.anyOf = cleanedSchema.anyOf.map((item: any) => this.cleanSchema(item));
      }
    }

    if (cleanedSchema.oneOf && Array.isArray(cleanedSchema.oneOf)) {
      // Similar simplification for oneOf
      const types = cleanedSchema.oneOf.map((item: any) => item.type).filter(Boolean);
      if (types.length > 0 && types.every((t: string) => t === types[0])) {
        cleanedSchema.type = types[0];
        delete cleanedSchema.oneOf;
      } else {
        cleanedSchema.oneOf = cleanedSchema.oneOf.map((item: any) => this.cleanSchema(item));
      }
    }

    if (cleanedSchema.allOf && Array.isArray(cleanedSchema.allOf)) {
      cleanedSchema.allOf = cleanedSchema.allOf.map((item: any) => this.cleanSchema(item));
    }

    // Recursively clean properties
    if (cleanedSchema.properties && typeof cleanedSchema.properties === 'object') {
      const cleanedProperties: any = {};
      for (const [key, value] of Object.entries(cleanedSchema.properties)) {
        cleanedProperties[key] = this.cleanSchema(value);
      }
      cleanedSchema.properties = cleanedProperties;
    }

    // Clean array items
    if (cleanedSchema.items) {
      cleanedSchema.items = this.cleanSchema(cleanedSchema.items);
    }

    // Ensure we only keep supported schema fields
    const supportedFields = [
      'type',
      'properties',
      'required',
      'description',
      'enum',
      'items',
      'anyOf',
      'oneOf',
      'allOf',
    ];
    const finalSchema: any = {};

    supportedFields.forEach((field) => {
      if (cleanedSchema[field] !== undefined) {
        finalSchema[field] = cleanedSchema[field];
      }
    });

    return finalSchema;
  }

  private async callTool(name: string, args: any) {
    try {
      // Get the tool schema
      const toolSchema = this.tools.find((t) => t.name === name)?.parameters;

      // Inject "database": "gologs" if it's required but missing
      if (toolSchema && toolSchema.required?.includes('database') && !('database' in args)) {
        args.database = 'gologs';
      }

      const result = await this.mcp.callTool({
        name,
        arguments: args,
      });

      return result.content;
    } catch (error) {
      console.error(`Error calling tool ${name}:`, error);
      throw error;
    }
  }

  async processQuery(query: string) {
    if (!this.isConnected) {
      await this.connect();
    }

    // Initialize model with function declarations
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      tools: [{ functionDeclarations: this.tools }], // Correct format for Gemini
    });

    const initialPrompt = `You are an AI assistant connected to a MongoDB database via MCP tools. You must decide which is the appropriate tool to use based on the query and the available tools.

MANDATORY WORKFLOW - You MUST follow these steps in EXACT order for EVERY collection you query:

1. FIRST: Use list-collections to see available collections

2. BEFORE TOUCHING ANY COLLECTION:
   YOU MUST ALWAYS run collection-schema first for the collection you want to query

3. ONLY AFTER getting the schema, you can:
   - Choose the appropriate tool (find/aggregate/count) based on the query needs
   - Use the exact field names from the schema
   - Use the correct data types as shown in the schema

4. For each new collection you want to query:
   - STOP
   - Go back to step 2
   - Get its schema FIRST
   - Then proceed with your query

❌ NEVER EXECUTE find/aggregate/count WITHOUT FIRST GETTING THE SCHEMA
❌ NEVER ASSUME FIELD NAMES OR TYPES
✅ ALWAYS GET SCHEMA FIRST

CRITICAL RULES:
- Work iteratively - if you don't find what you're looking for, try different approaches
- Keep track of what collections and queries you've already tried
- Be thorough but efficient - don't repeat the same queries
- If you find the exact information, clearly indicate SUCCESS
- If you've exhausted all possibilities, clearly indicate COMPLETED
- Maintain conversation context between iterations

Current database: gologs
User query: ${query}`;

    let finalOutput = '';
    let iterationCount = 0;
    const MAX_ITERATIONS = 10;
    let searchComplete = false;

    // Build conversation contents array
    const contents: any[] = [
      {
        role: 'user',
        parts: [{ text: initialPrompt }],
      },
    ];

    // Send initial message
    let result = await this.model.generateContent({
      contents: contents,
    });

    while (!searchComplete && iterationCount < MAX_ITERATIONS) {
      iterationCount++;
      console.log(`\n--- Iteration ${iterationCount} ---`);

      try {
        const response = result.response;
        const text = response.text();
        console.log(`Gemini response text: ${text}`);

        // Check for function calls
        const functionCalls = response.functionCalls();

        if (functionCalls && functionCalls.length > 0) {
          console.log('\n--- Function calls detected ---');

          // Process each function call
          const functionResponses = [];

          for (const functionCall of functionCalls) {
            console.log('Function call:', functionCall.name);
            console.log('Args:', JSON.stringify(functionCall.args, null, 2));

            try {
              const toolResult = await this.callTool(functionCall.name, functionCall.args);
              console.log('Tool result:', JSON.stringify(toolResult, null, 2));

              functionResponses.push({
                name: functionCall.name,
                response: { result: toolResult }, // Wrap in result object
              });
            } catch (error) {
              console.error(`Error calling function ${functionCall.name}:`, error);
              functionResponses.push({
                name: functionCall.name,
                response: { error: error },
              });
            }
          }

          // Add model's function call to conversation
          contents.push({
            role: 'model',
            parts: functionCalls.map((fc) => ({ functionCall: fc })),
          });

          // Send function responses back to the model
          const parts = functionResponses.map((fr) => ({
            functionResponse: {
              name: fr.name,
              response: fr.response,
            },
          }));

          // Add function responses to conversation
          contents.push({
            role: 'user',
            parts: parts,
          });

          // Generate next response
          result = await this.model.generateContent({
            contents: contents,
          });
        } else {
          // No function calls, check if we're done
          if (text.includes('SUCCESS') || text.includes('COMPLETED')) {
            searchComplete = true;
            finalOutput = text;
          } else {
            // Continue the conversation
            contents.push({
              role: 'model',
              parts: [{ text }],
            });
            contents.push({
              role: 'user',
              parts: [
                {
                  text: 'Continue with your analysis. Use the available tools to query the database.',
                },
              ],
            });

            result = await this.model.generateContent({
              contents: contents,
            });
          }
        }
      } catch (error) {
        console.error('Error in chat iteration:', error);
        finalOutput = `Error occurred: ${error}`;
        break;
      }
    }

    if (!finalOutput) {
      finalOutput = `\nREACHED MAXIMUM ITERATIONS (${MAX_ITERATIONS}): Search stopped after trying multiple approaches.`;
    }

    return finalOutput;
  }

  async cleanup() {
    if (this.isConnected && this.transport) {
      await this.mcp.close();
      this.isConnected = false;
    }
  }
}
