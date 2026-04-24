import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { z } from "zod";
import { ToolMessage } from "@langchain/core/messages";

const history = new InMemoryChatMessageHistory();

const getUserQQ = tool(
  async (params, config) => {
    // config 是 tool.invoke 的第二个参数
    const qq = config.qqName === "Yann" ? "99324081817" : null;
    return qq ? `QQ: ${qq}` : "未找到该用户";
  },
  {
    name: "get_user_qq",
    description: "输入名字，查询并返回其QQ号码。",
    schema: z.object({}),
  },
);

const tools = [getUserQQ];

const model = new ChatOpenAI({
  model: process.env.MODEL_NAME,
  temperature: 0,
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
  structuredOutput: true,
  logprobs: !true, // 模型会在响应中返回每个 token 的 logprobs 信息，包括 token 本身、概率、以及 top logprobs（即模型认为最可能的几个 token 及其概率）。这个功能对于分析模型的推理过程、理解模型的决策依据非常有帮助，可以让我们看到模型在生成每个 token 时的考虑因素和权衡。
});

const modelWithTools = model.bindTools(tools);

await history.addUserMessage("Yann的QQ号码是多少？");

const response = await modelWithTools.invoke(await history.getMessages(), {
  runName: "model invoke",
  tags: ["model invoke"],
  metadata: {
    "model-invoke": true,
  },
  // 用于监听模型执行过程，应用场景包括：分析模型的推理过程、调试模型的行为、以及在执行过程中收集数据等。
  // 记录日志、监控性能、分析模型的决策过程等
  // 配合 LangSmith 平台的实验功能，可以在模型执行过程中收集更丰富的数据，并在平台上进行可视化分析。
  callbacks: [
    {
      // 使用对象形式的回调
      handleLLMStart: (llm, prompts, runId, parentRunId, extraParams, tags, metadata, runName) => {
        console.log("\n【内联回调】LLM 开始执行...");
      },
      handleLLMEnd: () => {
        console.log("\n【内联回调】LLM 执行完成！");
      },
    },
  ],
  // 配置项，用于控制模型执行时的行为，如超时、最大迭代次数等。
  configurable: {
    timeout: 10000, // 设置模型执行的超时时间为 10 秒
    maxIterations: 5,
    stop: ["\n"],
    "model-invoke": true,
  },
  userId: "Yann.",
});

await history.addAIMessage(response);

if (response.tool_calls.length > 0) {
  if (response.tool_calls[0].name === "get_user_qq") {
    const toolMessage = await getUserQQ.invoke(response.tool_calls[0].args, {
      qqName: "Yann",
    });

    await history.addMessage(
      new ToolMessage({
        content: toolMessage,
        tool_call_id: response.tool_calls[0].id,
      }),
    );

    const result = await modelWithTools.invoke(await history.getMessages());
    console.log(result.content);
  }
} else {
  console.log("模型输出:", response.content);
}
