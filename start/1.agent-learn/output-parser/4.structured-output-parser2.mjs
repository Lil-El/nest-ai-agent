import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
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
  age: z.number().describe("年龄"),
  occupation: z.string().describe("职业"),
  awards: z
    .array(
      z.object({
        name: z.string().describe("奖项名称"),
        year: z.number().describe("获奖年份"),
        reason: z.string().optional().describe("获奖原因"),
      }),
    )
    .describe("获得的重要奖项列表"),
});

const parser = StructuredOutputParser.fromZodSchema(schema);

const question = `请介绍一下居里夫人的详细信息，包括她的姓名、年龄、职业以及所获得的重要奖项。

${parser.getFormatInstructions()}`;

const response = await model.invoke(question);

const json = await parser.parse(response.content);

console.log(json);
