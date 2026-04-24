import { tool } from "@langchain/core/tools";
import fs from "fs/promises";
import path from "path";
import { spawn } from "child_process";
import { z } from "zod";
import chalk from "chalk";

const readFileTool = tool(
  async ({ filePath }) => {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      console.log(chalk.yellow(`[工具调用] read_file("${filePath}") - 成功读取 ${content.length} 字节`));
      return `文件内容:\n${content}`;
    } catch (error) {
      return `读取文件失败: ${error.message}`;
    }
  },
  {
    name: "read_file",
    description: "读取指定路径文件",
    schema: z.object({
      filePath: z.string().describe("文件路径"),
    }),
  }
);

const writeFileTool = tool(
  async ({ filePath, content }) => {
    try {
      const dir = path.dirname(filePath);
      console.log(chalk.yellow(`[工具调用] write_file("${filePath}", content) - 正在写入文件...`));
      await fs.mkdir(dir, { recursive: true }); // 确保目录存在, recursive: true 允许创建多层目录
      await fs.writeFile(filePath, content, "utf-8");
      return `成功写入文件: ${filePath}`;
    } catch (error) {
      return `写入文件失败: ${error.message}`;
    }
  },
  {
    name: "write_file",
    description: "写入内容到指定路径文件",
    schema: z.object({
      filePath: z.string().describe("文件路径"),
      content: z.string().describe("要写入的内容"),
    }),
  }
);

const executeCommandTool = tool(
  async ({ command, workingDirectory }) => {
    const cwd = workingDirectory || process.cwd();
    return new Promise((resolve, reject) => {
      const [cmd, ...args] = command.split(" ");
      console.log(
        chalk.yellow(`[工具调用] execute_command("${command}", workingDirectory="${cwd}") - 正在执行命令...`)
      );
      const child = spawn(cmd, args, {
        cwd,
        stdio: "inherit",
        shell: true,
      });

      let errorMsg = "";

      child.on("error", (error) => {
        errorMsg += error.message;
      });

      child.on("close", (code) => {
        if (code === 0) {
          const cwdInfo = workingDirectory
            ? `\n\n重要提示：命令在目录 "${workingDirectory}" 中执行成功。如果需要在这个项目目录中继续执行命令，请使用 workingDirectory: "${workingDirectory}" 参数，不要使用 cd 命令。`
            : "";
          resolve(`命令执行成功: ${command}${cwdInfo}`);
        } else {
          console.log(`  [工具调用] execute_command("${command}") - 执行失败，退出码: ${code}`);
          resolve(`命令执行失败，退出码: ${code}${errorMsg ? "\n错误: " + errorMsg : ""}`);
        }
      });
    });
  },
  {
    name: "execute_command",
    description: "执行指定的命令",
    schema: z.object({
      command: z.string().describe("要执行的命令"),
      workingDirectory: z.string().optional().describe("命令执行的工作目录, 默认为当前目录"), // 可选参数，默认为当前目录
    }),
  }
);

const listDirectoryTool = tool(
  async ({ directoryPath }) => {
    try {
      const files = await fs.readdir(directoryPath);
      console.log(chalk.yellow(`[工具调用] list_directory("${directoryPath}") - 成功列出 ${files.length} 个文件`));
      return `目录 ${directoryPath} 中的文件:\n${files.join("\n")}`;
    } catch (error) {
      return `读取目录失败: ${error.message}`;
    }
  },
  {
    name: "list_directory",
    description: "列出指定目录中的文件",
    schema: z.object({
      directoryPath: z.string().describe("要列出的目录路径"),
    }),
  }
);

export { readFileTool, writeFileTool, executeCommandTool, listDirectoryTool };
