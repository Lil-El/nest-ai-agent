import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";

const model = new ChatOpenAI({
  model: process.env.MODEL_NAME,
  temperature: 0,
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

const nativeTemplate = PromptTemplate.fromTemplate(`
  你是一名严谨但不失人情味的工程团队负责人，需要根据本周数据写一份周报。

  公司名称：{company_name}
  部门名称：{team_name}
  直接汇报对象：{manager_name}
  本周时间范围：{week_range}

  本周团队核心目标：
  {team_goal}

  本周开发数据（Git 提交 / Jira 任务）：
  {dev_activities}

  请根据以上信息生成一份【Markdown 周报】，要求：
  - 有简短的整体 summary（两三句话）
  - 有按模块/项目拆分的小结
  - 用一个 Markdown 表格列出关键指标（字段示例：模块 / 亮点 / 风险 / 下周计划）
  - 语气专业但有一点人情味，适合作为给老板和团队抄送的周报。
`);

const prompt = await nativeTemplate.format({
  company_name: "Tincher",
  team_name: "研发团队",
  manager_name: "张总",
  week_range: "2024-06-01 至 2024-06-07",
  team_goal: "完成核心功能开发，提升系统稳定性",
  dev_activities:
    "- Git 提交：\n  - 模块 A：修复了 5 个 bug，提交了 10 次\n  - 模块 B：完成了新功能开发，提交了 15 次\n- Jira 任务：\n  - 模块 A：关闭了 8 个任务，剩余 2 个\n  - 模块 B：完成了所有任务",
});

console.log("生成的 Prompt：\n", prompt);

const stream = await model.stream(prompt);

console.log("模型输出：");
for await (const chunk of stream) {
  process.stdout.write(chunk.content);
}
