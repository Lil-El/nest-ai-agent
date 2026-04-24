import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import {
  PromptTemplate,
  PipelinePromptTemplate,
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from "@langchain/core/prompts";

const sysTemplate = SystemMessagePromptTemplate.fromTemplate(
  `你是一名资深工程团队负责人，擅长用结构化、易读的方式写技术周报。
写作风格要求：{tone}。

请根据后续用户提供的信息，帮他生成一份适合给老板和团队同时抄送的周报草稿。`,
);

const humanTemplate = HumanMessagePromptTemplate.fromTemplate(
  `本周信息如下：

公司名称：{company_name}
团队名称：{team_name}
直接汇报对象：{manager_name}
本周时间范围：{week_range}

本周团队核心目标：
{team_goal}

本周开发数据（Git 提交 / Jira 任务等）：
{dev_activities}

请据此输出一份 Markdown 周报，结构建议包含：
1. 本周概览（2-3 句话）
2. 详细拆分（按项目或模块分段）
3. 关键指标表格（字段示例：模块 / 亮点 / 风险 / 下周计划）

语气专业但有人情味。`,
);

const finalChatPrompt = ChatPromptTemplate.fromMessages([sysTemplate, humanTemplate]);

const prompt = await finalChatPrompt.formatMessages({
  tone: "专业、清晰、略带鼓励",
  company_name: "星航科技",
  team_name: "AI 平台组",
  manager_name: "王总",
  week_range: "2025-05-12 ~ 2025-05-18",
  team_goal: "完成周报自动生成能力的灰度验证，并收集团队反馈。",
  dev_activities:
    "- Git：本周合并 4 个主要特性分支，包含 Prompt 配置化和日志观测优化\n" +
    "- Jira：关闭 9 个 Story / 5 个 Bug，新增 2 个 TechDebt 任务\n" +
    "- 运维：本周线上 P1 事故 0 起，P2 1 起（由配置变更引起，已完成复盘）\n" +
    "- 其他：完成与数据平台、运维平台两次联合评审会议",
});

console.log('使用 SystemMessagePromptTemplate / HumanMessagePromptTemplate 生成的消息:');
console.log(prompt);
