import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { StructuredOutputParser } from "@langchain/core/output_parsers";

const model = new ChatOpenAI({
  model: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

const schema = z.object({
  name: z.string().describe("姓名"),
  birth_year: z.number().describe("出生年份"),
  death_year: z.number().describe("去世年份"),
  nationality: z.string().describe("国籍"),
  occupation: z.string().describe("职业"),
  famous_works: z.array(z.string()).describe("著名作品列表"),
  biography: z.string().describe("简短传记"),
});

const parser = StructuredOutputParser.fromZodSchema(schema);

const prompt = `简单介绍莫扎特的信息，包含姓名、出生年份、去世年份、国籍、职业、著名作品列表和简短传记。${parser.getFormatInstructions()}`;

const stream = await model.stream(prompt);

let count = "";

console.log("🌊 流式结构化输出演示\n");

for await (const chunk of stream) {
  console.log(chunk.content);
  count += chunk.content;
}

const result = await parser.parse(count);

console.log("✅ 结果:\n");
console.log(result);
