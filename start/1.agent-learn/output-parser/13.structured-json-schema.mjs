// 指定大模型的输出格式为 json_schema 指定格式，它就会按照这个格式输出。
/**
 * json schema 就和 tool 的 args 一样，都是大模型层面支持的，会保证按照这个格式来返回，如果格式不对，会在模型层面重新生成正确的返回。
 * 也就是说，withStructuredOutput 底层是 tool、json schema、output parser 这三者。
 */
import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import chalk from "chalk";

const schema = z
  .object({
    name: z.string().describe("科学家的全名"),
    birth_year: z.number().describe("出生年份"),
    field: z.string().describe("主要研究领域"),
    achievements: z.array(z.string()).describe("主要成就列表"),
  })
  .strict();

const nativeJsonSchema = zodToJsonSchema(schema);

// 有的模型返回的结果不符合 json schema 的格式，例如 qwen-plus
const model = new ChatOpenAI({
  model: "qwen-max",
  temperature: 0,
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
  modelKwargs: {
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "scientist_info",
        strict: true,
        schema: nativeJsonSchema,
      },
    },
  },
});

const response = await model.invoke([
  new SystemMessage("你是一个信息提取助手，请直接返回 JSON 数据。"),
  new HumanMessage("介绍一下杨振宁"),
]);

console.log(chalk.green("\n✅ 收到响应 (纯净 JSON):"));
console.log(response.content);

console.log(chalk.cyan("\n📋 解析后的对象:"));
console.log(JSON.parse(response.content));
