import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { XMLOutputParser } from "@langchain/core/output_parsers";

// 初始化模型
const model = new ChatOpenAI({
  modelName: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

const parser = new XMLOutputParser();

const question = `请提取以下文本中的人物信息：阿尔伯特·爱因斯坦出生于 1879 年，是一位伟大的物理学家。

${parser.getFormatInstructions()}`;

const response = await model.invoke(question);

console.log("📤 模型原始响应:\n");
console.log(response.content);

const result = await parser.parse(response.content);

console.log("\n✅ XMLOutputParser 自动解析的结果:\n");
console.log(result);
