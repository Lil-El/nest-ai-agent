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

const schema = z.object({
  name: z.string().describe("姓名"),
  birth_year: z.number().describe("出生年份"),
  death_year: z.number().describe("去世年份"),
  nationality: z.string().describe("国籍"),
});

const modelWithStructured = model.withStructuredOutput(schema);

const prompt = `简单介绍莫扎特的信息，包含姓名、出生年份、去世年份和国籍。`;

const stream = await modelWithStructured.stream(prompt);

for await (const chunk of stream) {
  console.log("🌊 带结构化输出的流式输出演示\n");
  console.log(JSON.stringify(chunk, null, 2));
}

/**
 * 虽然我们是用的 stream 的流式方式打印的
  但是用了 withStructuredOutput 之后，它会在 json 生成完通过校验后再返回（底层是 tool calls）。
  所以只有一个 chunk 包含完整 json
  这样明显不是真的流式。
 */
