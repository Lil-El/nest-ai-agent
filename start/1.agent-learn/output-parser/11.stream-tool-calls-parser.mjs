import "dotenv/config";
import { JsonOutputToolsParser } from "@langchain/core/output_parsers/openai_tools";
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
const scientistSchema = z.object({
  name: z.string().describe("科学家的全名"),
  birth_year: z.number().describe("出生年份"),
  death_year: z.number().optional().describe("去世年份，如果还在世则不填"),
  nationality: z.string().describe("国籍"),
  achievements: z.array(z.string()).describe("主要成就"),
});

const parser = new JsonOutputToolsParser();

const modelWithTools = model.bindTools([
  {
    name: "extract_scientist_info",
    description: "从文本中提取科学家信息，返回结构化数据",
    schema: scientistSchema,
  },
]);

const chain = modelWithTools.pipe(parser);

try {
  const stream = await chain.stream("介绍牛顿的生平和成就");

  for await (const chunk of stream) {
    if (chunk.length > 0) {
      console.log(chunk[0].args);
    }
  }
} catch (error) {}
