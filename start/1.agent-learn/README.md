# agent-learn

> Node version 22.17.0

> 使用千问大模型进行AI学习
>
> 1. tool
> 2. mcp
> 3. rag
> 4. milvus
> 5. memory
> 6. output-parser
> 7. project
> 8. prompt template
> 9. runnable
> 10. graph
> example: 个人调试

## [使用 API Key](https://bailian.console.aliyun.com/cn-beijing/?tab=api#/api)

### 方式一：在第三方工具中调用模型

如果在 Chatbox 等工具或平台中调用模型，您可能需要输入三个信息：

- 本文获取的 API Key
- API Key 所属地域的 Base URL：
  ■ 华北 2（北京）：https://dashscope.aliyuncs.com/compatible-mode/v1
- 模型名称，如 qwen-plus
  常用工具配置：Chatbox、Cline、Claude Code、Dify、OpenClaw（原 Clawdbot/Moltbot）、Postman、Qwen Code。

### 方式二：通过代码调用模型

通过代码首次调用千问 API，建议配置 API Key 到环境变量，以避免硬编码在代码中导致泄露风险。

## 运行

```bash
node ./src/1.hello-langchain.mjs
```

## 📦 Tool（工具）

Tool 是 LangChain 框架中用于扩展大模型能力的机制。大模型本身只能进行文本对话，但通过 Tool，AI 可以：

📁 读写文件
🖥️ 执行系统命令
📂 浏览目录
🔌 调用外部 API

## 🔌 MCP（Model Context Protocol）

MCP 是一种标准化协议，用于连接 AI 模型与外部服务。它允许你将工具实现与主程序分离，形成独立的服务。

### 🖥️ Server 端

独立的 Node.js 进程，提供用户查询等服务：

```js
// 伪代码示例
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const server = new McpServer();

// 注册工具
server.tool(
  "query_user", // 工具名称
  "查询用户信息", // 描述
  { userId: z.string() }, // 参数定义
  async ({ userId }) => {
    // 查询数据库或调用 API
    return userInfo;
  },
);
```

### 📱 Client 端（index.mjs）

主程序连接到 MCP 服务器并使用其提供的工具：

```js
import { MultiServerMCPClient } from "@langchain/mcp-adapters";

// 1. 创建客户端并连接服务器
const mcpClient = new MultiServerMCPClient({
  mcpServers: {
    "user-mcp-server": {
      command: "node",
      args: ["./src/5.mcp/server.mjs"],
    },
  },
});

// 2. 获取所有工具
const tools = await mcpClient.getTools();

// 3. 像普通 Tool 一样使用
const result = await tools
  .find((t) => t.name === "query_user")
  .invoke({
    userId: "002",
  });
```

### MCP 的优势

- 🔗 解耦: 工具实现与主程序分离，独立部署
- ♻️ 复用: 一个 MCP 服务可被多个客户端使用
- 📐 标准化: 遵循统一协议，易于集成第三方服务
- 🚀 扩展: 新增工具无需修改主程序代码

### MCP vs 普通 Tool

| 对比项   | 普通 Tool          | MCP Tool           |
| -------- | ------------------ | ------------------ |
| 位置     | 同一进程中         | 独立进程           |
| 部署     | 随主程序一起       | 可单独部署         |
| 通信     | 函数调用           | 进程间通信         |
| 适用场景 | 简单工具、本地操作 | 复杂服务、远程 API |

## RAG（检索增强生成）- 让 AI 不再“胡说八道”

RAG​ 是一种让大语言模型变得更聪明、更靠谱的技术。你可以把它想象成给一个“知识渊博但记性不好”的学者配了一个“超级图书管理员”。
传统 LLM 的痛点：大语言模型（如 GPT）是基于训练时的“记忆”来回答问题的。如果问它训练数据里没有的、或者最新的信息，它就可能会“编造”答案（幻觉现象）。
RAG 的解决方案：不依赖模型的“记忆”，而是实时从你的专属知识库（文档、数据库等）中查找相关信息，然后把“标准答案”和问题一起交给模型，让它组织语言回答。

### 工作流程

```
用户提问： “我们公司今年的年假政策是什么？”
        ↓
🔍 第1步：检索
    - 将问题转化为向量（一串数字，代表语义）
    - 在知识库中快速查找最相关的文档片段
    - 比如找到《2026年员工手册》中关于年假的3段规定
        ↓
📄 第2步：增强
    - 把找到的3段规定文本，作为“参考材料”附在问题后面
    - 提示词变成：“请根据以下资料回答问题：[找到的3段文本] 问题：我们公司今年的年假政策是什么？”
        ↓
💬 第3步：生成
    - 模型基于“参考材料”生成准确、可靠的答案
    - 回答会引用具体条款，避免胡编乱造
```

## Milvus - 专门处理“向量”的数据库

1. 向量是什么？

   在 AI 世界里，一切皆可向量化：
   - 一段文字 → 通过嵌入模型 → 变成一个包含几百上千个数字的列表（向量）
   - 这个向量就像是这段文字的“数学指纹”，语义相近的文字，它们的“指纹”也相似

   例子：
   - “我喜欢机器学习” → 向量 [0.2, 0.8, -0.1, 0.5, ...]
   - “我爱人工智能” → 向量 [0.19, 0.79, -0.09, 0.48, ...] （两个向量很接近！）

2. Milvus 是做什么的？

   Milvus 是一个专门存储和搜索“向量指纹”的数据库。它的核心任务是：
   给你一个问题的“指纹”，在几百万个文档“指纹”中，瞬间找出最相似的几个。

3. 核心概念（类比理解）

   | Milvus 概念     | 类比理解     | 作用                                   |
   | --------------- | ------------ | -------------------------------------- |
   | 集合 Collection | 图书馆       | 存放同一类文档的地方，比如"技术文档库" |
   | 向量 Vector     | 书籍的索引卡 | 每段文本的"数学指纹"                   |
   | 元数据 Metadata | 书籍信息卡   | 存储原文、文件名、页码等附加信息       |
   | 相似度搜索      | 找相似的书   | 根据内容相似度，而不是关键词匹配来查找 |

## PromptTemplate - 提示词模板

PromptTemplate 是 LangChain 中用于构建和管理提示词模板的核心组件。它允许您创建可重用的提示词结构，通过动态填充变量来生成不同的提示词。

### PromptTemplate

#### 基本用法

`PromptTemplate` 是最基础的提示词模板类，适用于简单的文本提示词场景。

##### 1. 使用 `fromTemplate` 快速创建

```javascript
import { PromptTemplate } from "@langchain/core/prompts";

const template = PromptTemplate.fromTemplate(`
你是一名{role}，请帮我完成以下任务：

任务：{task}
要求：{requirements}

请以{format}格式输出。
`);

const prompt = await template.format({
  role: "技术文档工程师",
  task: "编写 API 文档",
  requirements: "详细、准确、易懂",
  format: "Markdown",
});
```

---

##### 2. 使用构造函数创建（支持默认值）

```javascript
import { PromptTemplate } from "@langchain/core/prompts";

const template = new PromptTemplate({
  template: `请为{company}撰写一份{document_type}。

公司背景：{background}
目标受众：{audience}
重点内容：{focus}
字数要求：{word_count}字`,

  inputVariables: ["company", "document_type", "focus"],

  partialVariables: {
    background: "一家专注于人工智能的科技公司",
    audience: "企业客户和合作伙伴",
    word_count: "800",
  },
});

const prompt = await template.format({
  company: "创新科技",
  document_type: "产品介绍文案",
  focus: "核心功能和竞争优势",
});
```

---

##### 3. 动态部分变量（Partial）

```javascript
import { PromptTemplate } from "@langchain/core/prompts";

// 创建模板时只指定部分变量
const template = new PromptTemplate({
  template: `你是{role}。请根据上下文回答问题。

上下文：
{context}

问题：{question}

回答要求：{instructions}`,

  inputVariables: ["question"],
  partialVariables: {
    role: "专业顾问",
    context: "LangChain 是构建 LLM 应用的框架...",
    instructions: "回答要准确、简洁、有条理",
  },
});

// 使用时只需提供剩余变量
const prompt = await template.format({
  question: "LangChain 的主要功能是什么？",
});

// 也可以后续添加部分变量
const template2 = new PromptTemplate({
  template: `分析以下{industry}公司的{report_type}。

公司名称：{company_name}
时间范围：{time_period}
重点关注：{focus_areas}`,

  inputVariables: ["company_name", "report_type", "time_period"],
  partialVariables: {
    industry: "科技",
    focus_areas: "技术创新、市场表现、财务状况",
  },
});

// 后续可以继续添加 partial
const templateWithMorePartials = await template2.partial({
  report_type: "年度财报",
  time_period: "2024 财年",
});

const finalPrompt = await templateWithMorePartials.format({
  company_name: "阿里巴巴",
});
```

---

### ChatPromptTemplate

#### 基本用法

`ChatPromptTemplate` 专门用于聊天模型，支持多轮对话的消息结构（System/Human/AI）。

##### 1. 复杂的消息结构

```javascript
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";

const complexTemplate = ChatPromptTemplate.fromMessages([
  ["system", "你是一个有用的 AI 助手，名为{name}。"],
  ["human", "你好，我想咨询关于{topic}的问题。"],
  ["ai", "好的，我很乐意为您解答关于{topic}的问题。请问具体想了解什么？"],
  ["human", "{followup_question}"],
  new MessagesPlaceholder("history"), // 插入历史对话
  ["human", "{final_question}"],
]);

const messages = await complexTemplate.formatMessages({
  name: "智能助手",
  topic: "机器学习",
  followup_question: "有哪些入门算法推荐？",
  history: [
    ["human", "我想学习机器学习"],
    ["ai", "很好！您想了解哪个方面呢？"],
  ],
  final_question: "深度学习需要数学基础吗？",
});
```

---

##### 2. 带默认值的聊天模板

```javascript
import { ChatPromptTemplate } from "@langchain/core/prompts";

const template = ChatPromptTemplate.fromMessages(
  [
    ["system", "你是{role}。{system_instruction}"],
    ["human", "{input}"],
  ],
  {
    partialVariables: {
      role: "专业翻译",
      system_instruction: "请将中文翻译成英文，保持原意准确。",
    },
  },
);

const messages = await template.formatMessages({
  input: "你好，世界！",
});
```

---

### MessagesPlaceholder

#### 基本用法

`MessagesPlaceholder` 用于在模板中预留位置，动态插入消息列表（如历史对话）。

```javascript
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";

// 创建带历史消息占位符的模板
const template = ChatPromptTemplate.fromMessages([
  ["system", "你是一个有帮助的助手。"],
  new MessagesPlaceholder("history"), // 这里会插入历史对话
  ["human", "{input}"],
]);

// 使用真实的历史对话
const chatHistory = [
  ["human", "今天天气怎么样？"],
  ["ai", "抱歉，我无法获取实时天气信息。"],
];

const messages = await template.formatMessages({
  history: chatHistory,
  input: "那你能做什么？",
});
```

---

### FewShotPromptTemplate

#### 基本用法

`FewShotPromptTemplate` 用于实现少样本学习（Few-Shot Learning），通过提供示例让模型更好地理解任务。

##### 1. 基础 Few-Shot 模板

```javascript
import { FewShotPromptTemplate, PromptTemplate } from "@langchain/core/prompts";

// 定义示例
const examples = [
  {
    input: "高兴",
    output: "开心、愉快、欣喜、雀跃",
  },
  {
    input: "悲伤",
    output: "难过、伤心、悲痛、哀伤",
  },
  {
    input: "愤怒",
    output: "生气、恼怒、愤慨、怒火",
  },
];

// 定义单个示例的模板
const exampleTemplate = new PromptTemplate({
  template: `输入：{input}\n输出：{output}`,
  inputVariables: ["input", "output"],
});

// 创建 Few-Shot 模板
const fewShotTemplate = new FewShotPromptTemplate({
  examples: examples,
  examplePrompt: exampleTemplate,
  prefix: "请根据以下示例，为给定词语提供近义词：",
  suffix: "输入：{new_input}\n输出：",
  inputVariables: ["new_input"],
});

const prompt = await fewShotTemplate.format({
  new_input: "恐惧",
});

console.log(prompt);
```

---

##### 2. 动态选择示例（Example Selector）

```javascript
import { FewShotPromptTemplate, PromptTemplate } from "@langchain/core/prompts";
import { SemanticSimilarityExampleSelector } from "@langchain/core/example_selectors";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

const examples = [
  { input: "苹果", output: "水果、食物" },
  { input: "汽车", output: "交通工具、车辆" },
  { input: "书本", output: "文具、知识载体" },
  { input: "电脑", output: "电子产品、设备" },
  { input: "玫瑰", output: "花卉、植物" },
];

// 创建语义相似度选择器
const exampleSelector = await SemanticSimilarityExampleSelector.fromExamples(
  examples,
  new OpenAIEmbeddings(),
  MemoryVectorStore,
  { k: 2 }, // 选择最相似的 2 个示例
);

const fewShotTemplate = new FewShotPromptTemplate({
  exampleSelector: exampleSelector, // 使用选择器而非固定示例
  examplePrompt: new PromptTemplate({
    template: `输入：{input}\n输出：{output}`,
    inputVariables: ["input", "output"],
  }),
  prefix: "根据示例完成分类任务：",
  suffix: "输入：{new_input}\n输出：",
  inputVariables: ["new_input"],
});

const prompt = await fewShotTemplate.format({
  new_input: "手机", // 会自动选择与"手机"最相似的示例
});
```

---

### 选择指南

```
需要哪种模板？
│
├─ 简单文本提示词 → PromptTemplate
│   ├─ 快速原型 → fromTemplate
│   └─ 生产环境 → 构造函数 (+ partialVariables)
│
├─ 聊天对话 → ChatPromptTemplate
│   └─ 需要历史对话 → + MessagesPlaceholder
│
└─ 需要示例 → FewShotPromptTemplate
    ├─ 示例少 (<10) → 直接使用
    └─ 示例多 (>10) → + ExampleSelector
```
