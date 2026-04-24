import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

const model = new ChatOpenAI({
  model: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

// 定义结构化输出的 schema
const scientistSchema = z.object({
  name: z.string().describe("科学家的全名"),
  birth_year: z.number().describe("出生年份"),
  nationality: z.string().describe("国籍"),
  fields: z.array(z.string()).describe("研究领域列表"),
});

/**
 * 对于需要频繁使用同一结构化输出的场景，可以直接通过 withStructuredOutput 方法创建一个新的模型实例，
 * 这样每次调用时就不需要重复传入 parser 了。
 * 使用 parser 的场景包含：1. 流式输出；2. 非json格式，xml、yaml等
 */
const structuredModel = model.withStructuredOutput(scientistSchema);

const result = await structuredModel.invoke("介绍一下爱因斯坦");

console.log("✅ 从 withStructuredOutput 直接获取的结果:\n");

console.log(result);
