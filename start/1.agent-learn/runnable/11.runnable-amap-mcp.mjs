import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { ToolMessage, HumanMessage } from "@langchain/core/messages";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { RunnableSequence, RunnableLambda, RunnableBranch, RunnablePassthrough } from "@langchain/core/runnables";
import chalk from "chalk";

const model = new ChatOpenAI({
  modelName: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0.3,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

const mcpClient = new MultiServerMCPClient({
  mcpServers: {
    "amap-maps-streamableHTTP": {
      url: "https://mcp.amap.com/mcp?key=" + process.env.AMAP_MAPS_API_KEY,
    },
    "chrome-devtools": {
      command: "npx",
      args: ["-y", "chrome-devtools-mcp@latest"],
    },
  },
});

const tools = await mcpClient.getTools();

const modelWithTools = model.bindTools(tools);

const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system", "你是一个可以调用 MCP 工具的智能助手。"],
  new MessagesPlaceholder("messages"),
  // ["human", "{input}"],
]);

const llmChain = promptTemplate.pipe(modelWithTools);

const toolExecutor = new RunnableLambda({
  func: async (input) => {
    const { tools, response } = input;
    const toolResults = [];

    // 这里不能直接用 forEach，因为 forEach 里是无法 await 的，而工具调用是异步的。
    // response.tool_calls.forEach(async (toolCall) => {
    //   const tool = tools.find((t) => t.name === toolCall.name);
    //   if (tool) {
    //     const toolResult = await tool.invoke(toolCall.args);
    //     const contentStr = typeof toolResult === "string" ? toolResult : toolResult?.text || JSON.stringify(toolResult);
    //     toolResults.push(
    //       new ToolMessage({
    //         content: contentStr,
    //         tool_call_id: toolCall.id,
    //       }),
    //     );
    //   }
    // });
    for (const toolCall of response.tool_calls ?? []) {
      const foundTool = tools.find((t) => t.name === toolCall.name);
      if (!foundTool) continue;

      const toolResult = await foundTool.invoke(toolCall.args);

      // 兼容不同返回格式的字符串化
      const contentStr = typeof toolResult === "string" ? toolResult : toolResult?.text || JSON.stringify(toolResult);

      toolResults.push(
        new ToolMessage({
          content: contentStr,
          tool_call_id: toolCall.id,
        }),
      );
    }

    return toolResults;
  },
});

const agentStepChain = RunnableSequence.from([
  RunnablePassthrough.assign({
    response: llmChain,
  }),
  RunnableBranch.from([
    // 工具执行完毕的分支
    [
      (state) => !state.response?.tool_calls || state.response.tool_calls.length === 0,
      new RunnableLambda({
        func: async (state) => {
          const { messages, response } = state;
          const newMessages = [...messages, response];
          console.log(chalk.bgBlue(`✅ 模型原始响应:\n`));

          return {
            ...state,
            messages: newMessages,
            done: true,
            final: response.content,
          };
        },
      }),
    ],
    // 默认分支，执行工具
    RunnableSequence.from([
      new RunnableLambda({
        func: async (state) => {
          const { messages, response } = state;
          const newMessages = [...messages, response];
          console.log(chalk.bgBlue(`🔍 检测到 ${response.tool_calls.length} 个工具调用`));
          console.log(chalk.bgBlue(`🔍 工具调用: ${response.tool_calls.map((t) => t.name).join(", ")}`));
          return {
            ...state,
            messages: newMessages,
          };
        },
      }),
      RunnablePassthrough.assign({
        toolMessages: toolExecutor,
      }),
      new RunnableLambda({
        func: async (state) => {
          const { messages, toolMessages } = state;
          return {
            ...state,
            messages: [...messages, ...(toolMessages ?? [])],
            done: false,
          };
        },
      }),
    ]),
  ]),
]);

async function run(query, maxIterations = 30) {
  let state = {
    messages: [new HumanMessage(query)],
    done: false,
    final: null,
    tools,
  };

  for (let i = 0; i < maxIterations; i++) {
    console.log(chalk.bgBlue(`\n\n 轮次 ${i + 1}`));
    state = await agentStepChain.invoke(state);
    console.log(chalk.bgBlue(`\n\n 模型响应:\n${state.messages.at(-1)?.content}\n`));

    if (state.done) {
      return state.final;
    }
  }

  return state.messages.at(-1)?.content;
}

await run(
  "北京南站附近的酒店，最近的 3 个酒店，拿到酒店图片，打开浏览器，展示每个酒店的图片，每个 tab 一个 url 展示，并且在把那个页面标题改为酒店名",
);

await mcpClient.close();