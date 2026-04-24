import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { StructuredOutputParser } from "@langchain/core/output_parsers";

const model = new ChatOpenAI({
  model: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

const parser = StructuredOutputParser.fromNamesAndDescriptions({
  name: "姓名",
  birth_year: "出生年份",
  nationality: "国籍",
  major_achievements: "主要成就，用逗号分隔的字符串",
  famous_theory: "著名理论",
});

const question = `请介绍一下爱因斯坦的信息。${parser.getFormatInstructions()}`;

model.invoke(question).then(async (response) => {
  console.log("📤 模型原始响应:\n");
  console.log(response.content);
  const result = await parser.parse(response.content);
  console.log("✅ StructuredOutputParser 自动解析的结果:\n");
  console.log(result);
});
