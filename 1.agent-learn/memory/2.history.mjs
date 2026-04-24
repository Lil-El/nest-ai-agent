import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { FileSystemChatMessageHistory } from "@langchain/community/stores/message/file_system";
import { fileURLToPath } from "url";
import path from "path";

const model = new ChatOpenAI({
  model: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

// 存到文件的聊天示例
async function fileHistoryDemo() {
  const __filepath = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filepath);
  const filePath = path.join(__dirname, "memory_history.json");

  const sessionId = "Jiwon.kim";

  const chatMemory = new FileSystemChatMessageHistory({
    sessionId,
    filePath,
  });

  const systemMessage = new SystemMessage("你是一个友好的做菜助手，喜欢分享美食和烹饪技巧。");

  // 第一轮聊天
  const humanMessage1 = new HumanMessage("你能推荐一些适合夏天吃的菜吗？");

  await chatMemory.addMessage(systemMessage);
  await chatMemory.addMessage(humanMessage1);

  const response1 = await model.invoke(await chatMemory.getMessages());

  await chatMemory.addMessage(response1);

  // 第二轮聊天
  const humanMessage2 = new HumanMessage("谢谢，那我再问你一个，你喜欢吃什么？");

  await chatMemory.addMessage(humanMessage2);

  const response2 = await model.invoke(await chatMemory.getMessages());

  await chatMemory.addMessage(response2);

  // Log
  console.log(`✓ 对话已更新到文件\n`);
}

fileHistoryDemo();
