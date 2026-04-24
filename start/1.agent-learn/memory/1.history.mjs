import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";

const model = new ChatOpenAI({
  model: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

// 存到内存中的聊天记录示例
async function inMemoryDemo() {
  const chatHistory = new InMemoryChatMessageHistory();

  const systemMessage = new SystemMessage("你是一个友好、幽默的做菜助手，喜欢分享美食和烹饪技巧。");

  // 第一轮对话
  const humanMessage1 = new HumanMessage("我想学做一道简单的菜，你有什么推荐吗？");

  await chatHistory.addMessage(humanMessage1);

  const messages1 = [systemMessage, ...(await chatHistory.getMessages())];

  const response1 = await model.invoke(messages1);

  await chatHistory.addMessage(response1);

  console.log("User:", humanMessage1.content);
  console.log("Assistant:", response1.content);

  // 第二轮对话
  const humanMessage2 = new HumanMessage("那我开始做吧！");
  await chatHistory.addMessage(humanMessage2);
  const messages2 = [systemMessage, ...(await chatHistory.getMessages())];

  const response2 = await model.invoke(messages2);
  await chatHistory.addMessage(response2);

  console.log("User:", humanMessage2.content);
  console.log("Assistant:", response2.content);

  // 展示所有聊天记录
  console.log("\n完整聊天记录:");
  const allMessages = await chatHistory.getMessages();
  allMessages.forEach((msg, index) => {
    const type = msg.type;
    const prefix = type === "human" ? "User:" : "Assistant:";
    console.log(`${index + 1}. [${prefix}]: ${msg.content.substring(0, 50)}...`); // 只显示前50个字符
  });
}

inMemoryDemo();