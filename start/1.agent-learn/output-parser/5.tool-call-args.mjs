import "dotenv/config";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
  modelName: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

// 定义结构化输出的 schema
const schema = z.object({
  name: z.string().describe("科学家的全名"),
  birth_year: z.number().describe("出生年份"),
  nationality: z.string().describe("国籍"),
  fields: z.array(z.string()).describe("研究领域列表"),
});

const modelWithTools = model.bindTools([
  {
    name: "extract_scientist_info",
    description: "从文本中提取科学家信息，返回符合 scientistSchema 的 JSON 对象",
    schema,
  },
]);

const response = await modelWithTools.invoke("列出 5 个最著名的科学家，并返回其信息，格式为 JSON。");

console.log("response.tool_calls:", response.tool_calls);

console.log("✅ 从工具调用参数中提取的科学家信息:\n");

console.log(response.tool_calls.map((call) => call.args));
