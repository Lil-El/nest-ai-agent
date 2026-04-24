import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { FileSystemChatMessageHistory } from "@langchain/community/stores/message/file_system";
import path from "path";
import { fileURLToPath } from "url";

const model = new ChatOpenAI({
  model: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

async function fileHistoryDemo() {
  const __filepath = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filepath);

  const filePath = path.join(__dirname, "memory_history.json");
  const sessionId = "Jiwon.kim";

  const chatMemory = new FileSystemChatMessageHistory({
    sessionId,
    filePath,
  });

  const restoredMessages = await chatMemory.getMessages();

  // 第3次对话，之前的对话历史已经被恢复了
  const humanMessage = new HumanMessage("好的");
  await chatMemory.addMessage(humanMessage);

  const response = await model.invoke(await chatMemory.getMessages());
  await chatMemory.addMessage(response);

  // Log
  console.log(`✓ 对话已保存到文件\n`);
}

fileHistoryDemo();
