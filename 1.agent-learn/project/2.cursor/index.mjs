import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { JsonOutputToolsParser } from "@langchain/core/output_parsers/openai_tools";
import { executeCommandTool, listDirectoryTool, readFileTool, writeFileTool } from "./tools.mjs";

import chalk from "chalk";

const model = new ChatOpenAI({
  model: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

const tools = [executeCommandTool, listDirectoryTool, readFileTool, writeFileTool];

const modelWithTools = model.bindTools(tools); // parser 绑定到模型

const parser = new JsonOutputToolsParser();

async function runAgentWithTools(query, maxIterations = 30) {
  const history = new InMemoryChatMessageHistory();
  await history.addMessage(
    new SystemMessage(`你是一个项目管理助手，使用工具完成任务。

当前工作目录: ${process.cwd()}

工具：
1. read_file: 读取文件
2. write_file: 写入文件
3. execute_command: 执行命令（支持 workingDirectory 参数）
4. list_directory: 列出目录

重要规则 - execute_command：
- workingDirectory 参数会自动切换到指定目录
- 当使用 workingDirectory 时，绝对不要在 command 中使用 cd
- 错误示例: { command: "cd react-todo-app && pnpm install", workingDirectory: "react-todo-app" }
- 正确示例: { command: "pnpm install", workingDirectory: "react-todo-app" }

重要规则 - write_file：
- 当写入 React 组件文件（如 App.tsx）时，如果存在对应的 CSS 文件（如 App.css），在其他 import 语句后加上这个 css 的导入
`),
  );
  await history.addUserMessage(query);

  for (let i = 0; i < maxIterations; i++) {
    let fullAIMessage = null;

    const stream = await modelWithTools.stream(await history.getMessages());

    const printedLengths = new Map();

    for await (const chunk of stream) {
      fullAIMessage = fullAIMessage ? fullAIMessage.concat(chunk) : chunk;

      let parsedTools = await parser.parseResult([{ message: fullAIMessage }]);
      console.log(chalk.green("Parsed tools:", JSON.stringify(parsedTools)));

      if (parsedTools.length > 0) {
        for (const toolCall of parsedTools) {
          if (toolCall.type === "write_file" && toolCall.args?.content) {
            const toolCallId = toolCall.id || toolCall.args.filePath || "default";
            const currentContent = String(toolCall.args.content);
            const previousLength = printedLengths.get(toolCallId);

            if (!previousLength) {
              printedLengths.set(toolCallId, 0);
            }

            if (currentContent.length > previousLength) {
              const newContent = currentContent.slice(previousLength);
              process.stdout.write(chalk.green(newContent));
              printedLengths.set(toolCallId, currentContent.length);
            }
          }
        }
      } else {
        // 如果没有工具调用，正常打印 AI 消息
        process.stdout.write(chunk.content);
      }
    }

    await history.addMessage(fullAIMessage);

    if (!fullAIMessage.tool_call_chunks || fullAIMessage.tool_calls.length === 0) {
      return fullAIMessage.content;
    }

    for (const toolCall of fullAIMessage.tool_calls) {
      const tool = tools.find((t) => t.name === toolCall.name);
      if (tool) {
        const result = await tool.invoke(toolCall.args);
        await history.addMessage(
          new ToolMessage({
            content: result,
            tool_call_id: toolCall.id,
          }),
        );
      }
    }
  }

  const messages = await history.getMessages();
  return messages.at(-1).content;
}

const case1 = `创建一个功能丰富的 React TodoList 应用：

1. 创建项目: echo. & echo. | pnpm create vite react-todo-app --template react-ts
2. 修改 src/App.tsx，实现完整功能的 TodoList：
 - 添加、删除、编辑、标记完成
 - 分类筛选（全部/进行中/已完成）
 - 统计信息显示
 - localStorage 数据持久化
3. 添加复杂样式：
 - 渐变背景（蓝到紫）
 - 卡片阴影、圆角
 - 悬停效果
4. 添加动画：
 - 添加/删除时的过渡动画
 - 使用 CSS transitions
5. 列出目录确认

注意：使用 pnpm，功能要完整，样式要美观，要有动画效果

去掉 main.tsx 里的 index.css 导入

之后在 react-todo-app 项目中：
1. 使用 pnpm install 安装依赖
2. 使用 pnpm run dev 启动服务器
`;

runAgentWithTools(case1);
