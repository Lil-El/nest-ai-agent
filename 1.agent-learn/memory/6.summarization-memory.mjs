import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { getBufferString, AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";

// import { getEncoding } from "js-tiktoken"; // 直接返回Tiktoken 实例
import { getEncoding } from "@langchain/core/utils/tiktoken"; // 返回 Promise 形式的 Tiktoken 实例

const model = new ChatOpenAI({
  model: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

async function countTokens(messages) {
  const encoding = await getEncoding("cl100k_base");
  let total = 0;
  messages.forEach((msg) => {
    total += encoding.encode(typeof msg.content === "string" ? msg.content : getBufferString(msg.content)).length;
  });
  return total;
}

async function summarizeHistory(messages) {
  if (messages.length === 0) return "";

  const text = getBufferString(messages, {
    humanPrefix: "用户",
    aiPrefix: "助手",
  });

  console.log("\n🔍 待总结的消息内容:\n", text);

  const prompt = `请总结以下对话内容，提炼出关键信息和要点，保持简洁明了：

${text}

总结：`;

  return (await model.invoke(prompt)).content;
}

// 按照tokens数量限制历史消息，超过限制则进行总结
async function summarizeMemoryDemo() {
  const history = new InMemoryChatMessageHistory();
  const maxTokens = 200;
  const keepRecentTokens = 80;

  const encoding = getEncoding("cl100k_base");

  const messages = [
    { type: "human", content: "我想学做红烧肉，你能教我吗？" },
    { type: "ai", content: "当然可以！红烧肉是一道经典的中式菜肴。首先需要准备五花肉、冰糖、生抽、老抽、料酒等材料。" },
    { type: "human", content: "五花肉需要切多大块？" },
    { type: "ai", content: "建议切成3-4厘米见方的块，这样既容易入味，口感也更好。切好后可以用开水焯一下去除血沫。" },
    { type: "human", content: "炒糖色的时候有什么技巧吗？" },
    {
      type: "ai",
      content:
        "炒糖色是关键步骤。用小火慢慢炒，等冰糖完全融化变成焦糖色，冒小泡时就可以下肉了。注意不要炒过头，否则会发苦。",
    },
    { type: "human", content: "需要炖多长时间？" },
    {
      type: "ai",
      content: "一般需要炖40-60分钟，用小火慢炖，直到肉变得软糯入味。可以用筷子戳一下，能轻松戳透就说明好了。",
    },
    { type: "human", content: "最后收汁的时候要注意什么？" },
    {
      type: "ai",
      content: "收汁时要用大火，不断翻动，让汤汁均匀包裹在肉块上。看到汤汁变得浓稠，颜色红亮就可以出锅了。",
    },
  ];

  await history.addMessages(
    messages.map((msg) => (msg.type === "human" ? new HumanMessage(msg.content) : new AIMessage(msg.content))),
  );

  let allMessages = await history.getMessages();

  const totalTokens = await countTokens(allMessages);
  console.log("Total tokens in history:", totalTokens);

  if (totalTokens > maxTokens) {
    const recentMessages = [];
    let recentTokens = 0;

    for (let i = allMessages.length - 1; i >= 0; i--) {
      const tokens = await countTokens([allMessages[i]]);
      recentTokens += tokens;

      if (recentTokens <= keepRecentTokens) {
        recentMessages.unshift(allMessages[i]);
      } else {
        break;
      }
    }

    const messagesToSummarize = allMessages.slice(0, allMessages.length - recentMessages.length);
    const summarizeTokens = await countTokens(messagesToSummarize);

    console.log("\n💡 Token 数量超过阈值，开始总结...");
    console.log(`📝 将被总结的消息数量: ${messagesToSummarize.length} (${summarizeTokens} tokens)`);
    console.log(`📝 将被保留的消息数量: ${recentMessages.length} (${recentTokens} tokens)`);

    // 调用模型进行总结
    const summary = await summarizeHistory(messagesToSummarize);

    // 用总结替换历史消息
    history.clear();
    history.addMessages([new SystemMessage("这是对之前对话的总结：" + summary), ...recentMessages]);

    console.log(`\n保留消息数量: ${recentMessages.length}`);
    console.log(`\n总结内容（不包含保留的消息）: ${summary}`);
  }
}

summarizeMemoryDemo();
