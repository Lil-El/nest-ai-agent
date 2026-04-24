import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

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
});

const modelWithTools = model.bindTools([
  {
    name: "extract_scientist_info",
    description: "提取和结构化科学家的详细信息",
    schema: scientistSchema,
  },
]);

const stream = await modelWithTools.stream("介绍牛顿的生平和成就");

for await (const chunk of stream) {
  if (chunk.tool_call_chunks && chunk.tool_call_chunks.length > 0) {
    process.stdout.write(chunk.tool_call_chunks[0].args);
  }
}

/**
 * tool_call_chunks: [
 *    {
 *      args: "xxxx",
 *      id: "",
 *      index: 0,
 *      type: "tool_call_chunk"
 *    }
 * ]
 *
 * 这时不能调用tool，参数还不够完整，所以它会等到参数完整了才返回一个chunk；
 * 如果希望在参数不完整的时候获取到json格式的输出，就需要使用 parser 了；
 */
