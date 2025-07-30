import { MCPClient } from './mcp.client';

export class ChatService {
  private mcpClient: MCPClient;

  constructor() {
    this.mcpClient = new MCPClient();
  }

  async processQuery(query: string, userId: string | undefined, isAdmin: boolean) {
    return await this.mcpClient.processQuery(query, userId, isAdmin);
  }

  async cleanup() {
    await this.mcpClient.cleanup();
  }
}
