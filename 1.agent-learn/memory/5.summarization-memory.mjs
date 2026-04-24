import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { getBufferString, HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";

const model = new ChatOpenAI({
  model: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

async function summarizedHistory(messages) {
  if (messages.length === 0) return "";

  // 将消息转换为文本格式，添加适当的前缀以区分不同角色
  const conversationText = getBufferString(messages, {
    humanPrefix: "用户",
    aiPrefix: "助手",
    systemPrefix: "系统",
  });

  const prompt = `请总结以下对话内容，提炼出关键信息和要点，保持简洁明了：

${conversationText}

总结：`;

  const response = await model.invoke(prompt);
  return response.content;
}

// 按照设定的最大消息数进行总结和保留最近消息的示例
async function summarizationMemoryDemo() {
  const history = new InMemoryChatMessageHistory();
  const maxMessages = 5; // 设置最大消息数

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

  if (allMessages.length > maxMessages) {
    // 保留最近的2个消息
    const keepRecent = 2;

    const recentMessages = allMessages.slice(-keepRecent);
    const messagesToSummarize = allMessages.slice(0, -keepRecent);

    const summary = await summarizedHistory(messagesToSummarize);

    // 清空历史并添加总结和最近消息
    await history.clear();
    await history.addMessages([new SystemMessage(`总结：${summary}`), ...recentMessages]);

    console.log(`\n保留消息数量: ${recentMessages.length}`);
    console.log("保留的消息:", recentMessages.map((m) => `${m.constructor.name}: ${m.content}`).join("\n  "));
    console.log(`\n总结内容（不包含保留的消息）: ${summary}`);
  }
}

summarizationMemoryDemo();