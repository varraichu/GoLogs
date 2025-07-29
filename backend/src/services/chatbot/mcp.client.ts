import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
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

interface ToolDef {
  name: string;
  description: string;
  input_schema: any;
}

export class MCPClient {
  private mcp: Client;
  private model: GenerativeModel;
  private genAI: GoogleGenerativeAI;
  private tools: ToolDef[] = [];
  private transport: StdioClientTransport | null = null;
  private isConnected: boolean = false;
  private chat: any = null;

  constructor() {
    this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY as string);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
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
      this.tools = toolsResult.tools.map((tool: any) => ({
        name: tool.name,
        description: tool.description || '',
        input_schema: tool.inputSchema,
      }));

      console.log(
        'Connected to Mongo MCP Server with tools:',
        this.tools.map((t) => t.name)
      );
      this.isConnected = true;
    } catch (e) {
      console.error('Failed to connect to MongoDB MCP server:', e);
      throw e;
    }
  }

  private async callTool(name: string, args: any) {
    try {
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

    if (!this.chat) {
      this.chat = this.model.startChat({
        history: [
          {
            role: 'user',
            parts: [
              {
                text: `You are an AI assistant connected to a MongoDB database via MCP tools. You MUST format tool calls EXACTLY like these examples:

For finding documents:
tool: find
args: {
  "database": "gologs",
  "collection": "users",
  "filter": {"username": "example"},
  "projection": {"email": 1, "username": 1},
  "sort": {"username": 1},
  "limit": 10
}

For aggregations:
tool: aggregate
args: {
  "database": "gologs",
  "collection": "logs",
  "pipeline": [
    {"$match": {"severity": "error"}},
    {"$group": {"_id": "$applicationId", "count": {"$sum": 1}}},
    {"$sort": {"count": -1}},
    {"$limit": 5}
  ]
}

For counts:
tool: count
args: {
  "database": "gologs",
  "collection": "logs",
  "query": {"level": "error", "timestamp": {"$gte": "2025-07-01"}}
}

For checking schema:
tool: collection-schema
args: {
  "database": "gologs",
  "collection": "users"
}

NEVER just talk about running a query - you must actually format and send it as shown above.

MANDATORY WORKFLOW - You MUST follow these steps in EXACT order for EVERY collection you query:

1. FIRST: Use list-collections to see available collections

2. BEFORE TOUCHING ANY COLLECTION:
   YOU MUST ALWAYS run collection-schema first:
   tool: collection-schema
   args: {
     "database": "gologs",
     "collection": "collection_name"
   }

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

DO NOT say "I am waiting for results" or "I executed a query" - you must actually format and send the query as shown above.

CRITICAL RULES:
- Work iteratively - if you don't find what you're looking for, try different approaches
- Keep track of what collections and queries you've already tried
- Be thorough but efficient - don't repeat the same queries
- If you find the exact information, clearly indicate SUCCESS
- If you've exhausted all possibilities, clearly indicate COMPLETED
- Maintain conversation context between iterations

Current database: gologs`,
              },
            ],
          },
          {
            role: 'model',
            parts: [
              {
                text: 'I understand my role and will follow the protocol strictly. I will always check schemas first and use exact field names.',
              },
            ],
          },
        ],
      });
    }

    const finalText: string[] = [];
    let iterationCount = 0;
    const MAX_ITERATIONS = 10;
    let searchComplete = false;

    while (!searchComplete && iterationCount < MAX_ITERATIONS) {
      iterationCount++;
      console.log(`Starting iteration ${iterationCount}`);

      try {
        console.log(`\n--- Iteration ${iterationCount} ---`);
        console.log(`Sending query: ${query}`);

        const result = await this.chat.sendMessage(query);
        const response = await result.response;
        const text = response.text();

        console.log(`Gemini response: ${text}`);
        console.log(`--- End Iteration ${iterationCount} ---\n`);

        let foundTool = false;
        const toolPattern = /tool:\s*([^\n]+)[\s\n]*args:\s*({[\s\S]+?})(?=\ntool:|$)/g;
        let match;

        while ((match = toolPattern.exec(text)) !== null) {
          foundTool = true;
          const [_, toolName, argsStr] = match;

          try {
            const args = JSON.parse(argsStr.trim());

            console.log('\n--- MCP Tool Call ---');
            console.log('Tool:', toolName.trim());
            console.log('Args:', JSON.stringify(args, null, 2));

            const toolResult = await this.callTool(toolName.trim(), args);

            console.log('Response:', JSON.stringify(toolResult, null, 2));
            console.log('--- End MCP Tool Call ---\n');

            finalText.push('\n--- MCP Tool Call ---');
            finalText.push(`Tool: ${toolName.trim()}`);
            finalText.push(`Args: ${JSON.stringify(args, null, 2)}`);
            finalText.push(`Response: ${JSON.stringify(toolResult, null, 2)}`);
            finalText.push('--- End MCP Tool Call ---\n');

            await this.chat.sendMessage(
              `Tool ${toolName.trim()} returned: ${JSON.stringify(toolResult)}`
            );
          } catch (parseError) {
            console.error('Error parsing tool args:', parseError);
            finalText.push(`Error executing tool ${toolName}: Invalid arguments`);
          }
        }

        if (!foundTool) {
          finalText.push(text);
          if (text.includes('SUCCESS') || text.includes('COMPLETED')) {
            searchComplete = true;
          }
        }

        if (!searchComplete && iterationCount < MAX_ITERATIONS) {
          await this.chat.sendMessage(
            'Continue searching. You MUST format your response as a tool call:\ntool: [toolname]\nargs: {...}\n\nDO NOT just describe what you want to do - actually format and send the query.'
          );
        }
      } catch (error: unknown) {
        console.error('Error in chat iteration:', error);
        finalText.push(
          `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
        );
        break;
      }
    }

    if (iterationCount >= MAX_ITERATIONS) {
      finalText.push(
        '\nREACHED MAXIMUM ITERATIONS: Search stopped after trying multiple approaches.'
      );
    }

    return finalText.join('\n');
  }

  async cleanup() {
    if (this.isConnected && this.transport) {
      await this.mcp.close();
      this.isConnected = false;
      this.chat = null;
    }
  }
}
