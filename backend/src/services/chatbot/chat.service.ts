import { MCPClient } from './mcp.client';

export class ChatService {
  private mcpClient: MCPClient;

  constructor() {
    this.mcpClient = new MCPClient();
  }

  async processQuery(query: string) {
    return await this.mcpClient.processQuery(query);
  }

  async cleanup() {
    await this.mcpClient.cleanup();
  }
}
