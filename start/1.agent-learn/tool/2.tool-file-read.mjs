import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import fs from "fs/promises";

import { z } from "zod";

const model = new ChatOpenAI({
  modelName: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_API_BASE_URL,
  },
  temperature: 0, // temperature 是温度，也就是 ai 的创造性，设置为 0，让它严格按照指令来做事情，不要自己发挥
});

const readFileTool = tool(
  async ({ filePath }) => {
    const content = await fs.readFile(filePath, "utf-8");
    console.log(`[工具调用] read_file("${filePath}") - 成功读取 ${content.length} 字节`);
    return `文件内容:\n${content}`;
  },
  {
    name: "read_file",
    description:
      "用此工具来读取文件内容。当用户要求读取文件、查看代码、分析文件内容时，调用此工具。输入文件路径（可以是相对路径或绝对路径）.",
    schema: z.object({
      filePath: z.string().describe("要读取的文件路径"),
    }),
  }
);

const tools = [readFileTool];

const modelWithTools = model.bindTools(tools);

const messages = [
  new SystemMessage(`你是一个代码助手，可以使用工具读取文件并解释代码。

工作流程：
1. 用户要求读取文件时，立即调用 read_file 工具
2. 等待工具返回文件内容
3. 基于文件内容进行分析和解释

可用工具：
- read_file: 读取文件内容（使用此工具来获取文件内容）
`),
  new HumanMessage(`请帮我读取并分析一下 src/tool-file-read.mjs 文件的内容。`),
];

let response = await modelWithTools.invoke(messages);

/*
console.log("模型输出:", response);

"tool_calls": [
  {
    "name": "read_file",
    "args": {
      "filePath": "./src/tool-file-read.mjs"
    },
    "type": "tool_call",
    "id": "call_b37e2297b2e4439da9af74"
  }
]
*/

messages.push(response); // 把AI消息放入数组中，也就是对话记录

while (response.tool_calls && response.tool_calls.length > 0) {
  console.log(`\n[检测到 ${response.tool_calls.length} 个工具调用]`);

  // 执行所有工具调用
  const toolResults = await Promise.all(
    response.tool_calls.map(async (toolCall) => {
      const tool = tools.find((t) => t.name === toolCall.name);
      if (!tool) {
        console.error(`未找到工具: ${toolCall.name}`);
        return `错误: 未找到工具 ${toolCall.name}`;
      }

      console.log(`[执行工具] ${toolCall.name}, [参数]:`, JSON.stringify(toolCall.args));

      try {
        const result = await tool.invoke(toolCall.args);
        return result;
      } catch (error) {
        return `工具执行失败: ${error.message}`;
      }
    })
  );

  // 将工具结果作为 ToolMessage 添加到对话中
  response.tool_calls.forEach((toolCall, index) => {
    // console.log(`工具调用结果 [${toolCall.name}]:`, toolResults[index]); // 打印的是文件内容
    messages.push(
      new ToolMessage({
        content: toolResults[index],
        tool_call_id: toolCall.id,
      })
    );
  });

  // 让模型基于工具结果继续生成响应
  response = await modelWithTools.invoke(messages);
  messages.push(response);
}

console.log("\n最终模型输出:", response.content);
