import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
  model: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

const prompt = `简单介绍莫扎特的信息。`;

console.log("🌊 普通流式输出演示\n");

const stream = await model.stream(prompt);

for await (const chunk of stream) {
  process.stdout.write(chunk.content);
}
