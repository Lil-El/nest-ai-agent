import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { PipelinePromptTemplate, PromptTemplate } from "@langchain/core/prompts";

const model = new ChatOpenAI({
  model: process.env.MODEL_NAME,
  temperature: 0,
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

// 模板可以导出，复用
export const personaPrompt = new PromptTemplate({
  inputVariables: ["tone"],
  template: `你是一名资深工程团队负责人，写作风格：{tone}。 你擅长把枯燥的技术细节写得既专业又有温度。\n`,
});

export const contextPrompt = PromptTemplate.fromTemplate(`
  公司：{company_name}
  部门：{team_name}
  直接汇报对象：{manager_name}
  本周时间范围：{week_range}
  本周部门核心目标：{team_goal}\n
`);

const taskPrompt = PromptTemplate.fromTemplate(
  `以下是本周团队的开发活动（Git / Jira 汇总）：
{dev_activities}

请你从这些原始数据中提炼出：
1. 本周整体成就亮点
2. 潜在风险和技术债
3. 下周重点计划建议\n`,
);

// D. 格式模块
const formatPrompt = PromptTemplate.fromTemplate(
  `请用 Markdown 输出周报，结构包含：
1. 本周概览（2-3 句话的 Summary）
2. 详细拆分（按模块或项目分段）
3. 关键指标表格，表头为：模块 | 亮点 | 风险 | 下周计划

注意：
- 尽量引用一些具体数据（如提交次数、完成的任务编号）
- 语气专业，但可以偶尔带一点轻松的口吻，符合 {company_values}。
`,
);

// E. 最终组合 Prompt（把上面几个模块拼在一起）
const finalWeeklyPrompt = PromptTemplate.fromTemplate(
  `{persona_block}
{context_block}
{task_block}
{format_block}

现在请生成本周的最终周报：`,
);

export const pipelinePrompt = new PipelinePromptTemplate({
  pipelinePrompts: [
    { name: "persona_block", prompt: personaPrompt },
    { name: "context_block", prompt: contextPrompt },
    { name: "task_block", prompt: taskPrompt },
    { name: "format_block", prompt: formatPrompt },
  ],
  finalPrompt: finalWeeklyPrompt,
  inputVariables: [
    "company_name",
    "team_name",
    "manager_name",
    "week_range",
    "team_goal",
    "dev_activities",
    "company_values",
  ],
});

const prompt = await pipelinePrompt.format({
  tone: "专业、清晰、略带幽默",
  company_name: "OpenAI",
  team_name: "LangChain",
  manager_name: "Jerry",
  week_range: "2023-05-01 ~ 2023-05-07",
  team_goal: "LangChain 1.0",
  dev_activities:
    "- Git: 58 次提交，3 个主要分支合并\n" +
    "- Jira: 完成 12 个 Story，关闭 7 个 Bug\n" +
    "- 关键任务：完成智能周报 Pipeline 设计、实现 Prompt 拆分、接入 ExampleSelector",
  company_values: "「极致、开放、靠谱」的价值观",
});

// console.log("PipelinePromptTemplate 组合后的 Prompt：");
// console.log(prompt);
