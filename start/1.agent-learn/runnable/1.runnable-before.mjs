import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";

const model = new ChatOpenAI({
  modelName: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

const schema = z.object({
  translation: z.string().describe("翻译后的韩文"),
  keywords: z.array(z.string()).length(3).describe("3个关键词"),
});

const outputParser = StructuredOutputParser.fromZodSchema(schema);

const prompt = PromptTemplate.fromTemplate(`请将以下中文翻译成韩文，并提取出3个关键词：{text} {instruction}`);

const input = {
  text: "今天天气真好！",
  instruction: outputParser.getFormatInstructions(),
};

const response = await model.invoke(await prompt.format(input));

const result = await outputParser.invoke(response);

console.log(result);
