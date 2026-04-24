import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";

const model = new ChatOpenAI({
  model: "qwen-plus",
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

const mcpClient = new MultiServerMCPClient({
  mcpServers: {
    "user-mcp-server": {
      command: "node",
      args: [`D:\/BDHJ\/ai-tool-test\/src\/5.mcp\/server.mjs`],
    },
    "amap-maps-streamableHTTP": {
      url: "https://mcp.amap.com/mcp?key=" + process.env.AMAP_MAPS_API_KEY,
    },
    filesystem: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", ...(process.env.ALLOWED_PATHS.split(",") || "")],
    },
    "chrome-devtools": {
      command: "npx",
      args: ["-y", "chrome-devtools-mcp@latest"],
    },
  },
});

const tools = await mcpClient.getTools();

const modelWithTools = model.bindTools(tools);

async function run(query, maxIterations = 30) {
  const messages = [new HumanMessage(query)];

  for (let i = 0; i < maxIterations; i++) {
    const response = await modelWithTools.invoke(messages);
    messages.push(response);

    if (response.tool_calls.length) {
      for (const tool of response.tool_calls) {
        const t = tools.find((t) => t.name === tool.name);
        if (t) {
          const result = await t.invoke(tool.args);

          let content;
          if (typeof result === "string") {
            content = result;
          } else if (result.text) {
            content = result.text;
          }

          messages.push(
            new ToolMessage({
              content,
              tool_call_id: tool.id,
            }),
          );
        }
      }
    } else {
      return response.content;
    }
  }

  return messages[messages.length - 1].content;
}

// await run("查询“上海”的经纬度，并返回结果。").then(console.log);
// await run("查询“上海”的经纬度，生成一个location.json文件，将结果保存进去").then(console.log);
await run("打开浏览器，进入百度，查询一下最新的热搜，把前三个热搜打开").then(console.log);

// 注释掉 await mcpClient.close(); 不关闭 mcp 进程就不会自动关掉浏览器了
await mcpClient.close();
