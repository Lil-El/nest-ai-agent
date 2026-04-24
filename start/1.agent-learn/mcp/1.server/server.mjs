import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const database = {
  users: {
    "001": { id: "001", name: "张三", email: "zhangsan@example.com", role: "admin" },
    "002": { id: "002", name: "李四", email: "lisi@example.com", role: "user" },
    "003": { id: "003", name: "王五", email: "wangwu@example.com", role: "user" },
  },
};

const server = new McpServer({
  name: "user-mcp-server",
  version: "1.0.0",
});

server.registerTool(
  "query_user",
  {
    description: "查询用户信息",
    inputSchema: z.object({
      userId: z.string().describe("用户 ID"),
    }),
  },
  async ({ userId }) => {
    const user = database.users[userId];
    if (user) {
      return {
        content: [
          {
            type: "text",
            text: `用户信息：\nID: ${user.id}\n姓名: ${user.name}\n邮箱: ${user.email}\n角色: ${user.role}`,
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: "text",
            text: `未找到用户：${userId}`,
          },
        ],
      };
    }
  },
);

server.registerResource(
  "使用指南",
  "docs://guide",
  {
    description: "这是一个使用指南资源，包含了如何使用这个MCP服务器的说明。",
    mimeType: "text/plain",
  },
  async () => {
    return {
      contents: [
        {
          uri: "docs://guide",
          mimeType: "text/plain",
          text: `MCP Server 使用指南

功能：提供用户查询等工具。

使用：在 Cursor 等 MCP Client 中通过自然语言对话，Cursor 会自动调用相应工具。`,
        },
      ],
    };
  },
);

// 提供 stdio 的本地进程的调用方式，也可以提供 http 的远程调用方式。
const transport = new StdioServerTransport();
await server.connect(transport);
