/*
1. create-table.mjs
2. intell-import.mjs
*/
import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import mysql from "mysql2/promise";

const model = new ChatOpenAI({
  model: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

const connection = await mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "admin",
});

const friendSchema = z.object({
  name: z.string().describe("姓名"),
  gender: z.string().describe("性别（男/女）"),
  birth_date: z.string().describe("出生日期，格式：YYYY-MM-DD，如果无法确定具体日期，根据年龄估算"),
  company: z.string().nullable().describe("公司名称，如果没有则返回 null"),
  title: z.string().nullable().describe("职位/头衔，如果没有则返回 null"),
  phone: z.string().nullable().describe("手机号，如果没有则返回 null"),
  wechat: z.string().nullable().describe("微信号，如果没有则返回 null"),
});

const friendArraySchema = z.array(friendSchema).describe("好友列表");

const modelWithStructuredOutput = model.withStructuredOutput(friendArraySchema);

async function extractAndInsert(text) {
  await connection.query(`USE hello;`);

  const prompt = `请从以下文本中提取好友信息，返回一个好友对象数组，包含姓名、性别、出生日期、公司名称、职位/头衔、手机号和微信号等字段，如果某个字段无法确定或不存在，请返回 null。\n\n文本内容：\n${text}`;

  const response = await modelWithStructuredOutput.invoke(prompt);

  const insertSql = `
    INSERT INTO friends (
      name,
      gender,
      birth_date,
      company,
      title,
      phone,
      wechat
    ) VALUES ?;
  `;

  const values = response.map((f) => [f.name, f.gender, f.birth_date || null, f.company, f.title, f.phone, f.wechat]);

  const [insertResult] = await connection.query(insertSql, [values]);

  console.log(`成功插入 ${insertResult.affectedRows} 条数据`);

  return {
    count: insertResult.affectedRows,
    insertIds: Array.from({ length: insertResult.affectedRows }, (_, i) => insertResult.insertId + i),
  };
}

async function main() {
  const sampleText = `我最近认识了几个新朋友。第一个是张总，女的，看起来30出头，在腾讯做技术总监，手机13800138000，微信是zhangzong2024。第二个是李工，男，大概28岁，在阿里云做架构师，电话15900159000，微信号lee_arch。还有一个是陈经理，女，35岁左右，在美团做产品经理，手机号是18800188000，微信chenpm2024。`;

  extractAndInsert(sampleText);
}

await main();
