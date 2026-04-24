import "dotenv/config";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { ChatOpenAI } from "@langchain/openai";
import chalk from "chalk";
import { HumanMessage, ToolMessage, SystemMessage } from "@langchain/core/messages";

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
  },
});

const tools = await mcpClient.getTools();

const modelWithTools = model.bindTools(tools);

let resourceContent = "";
const res = await mcpClient.listResources();
for (const [serverName, resources] of Object.entries(res)) {
  for (const resource of resources) {
    const content = await mcpClient.readResource(serverName, resource.uri);
    resourceContent += content[0].text;
  }
}

async function run(query, maxIterations = 30) {
  const messages = [new SystemMessage(resourceContent), new HumanMessage(query)];

  for (let i = 0; i < maxIterations; i++) {
    const response = await modelWithTools.invoke(messages);
    messages.push(response);

    if (response.tool_calls.length === 0) {
      console.log(chalk.green(`[模型回复] ${response.text}`));
      return response.content;
    }

    for (const call of response.tool_calls) {
      const tool = tools.find((tool) => tool.name === call.name);
      if (tool) {
        const result = await tool.invoke(call.args);
        messages.push(
          new ToolMessage({
            content: result,
            tool_call_id: call.id,
          }),
        );
      }
    }
  }

  return messages[messages.length - 1].content;
}

// await run("请查询用户 ID 为 002 的用户信息");
await run("MCP 的使用指南内容是什么？");

await mcpClient.close();
