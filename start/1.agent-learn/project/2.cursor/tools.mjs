import { tool } from "@langchain/core/tools";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { z } from "zod";

const executeCommandTool = tool(
  async ({ command, workingDir }) => {
    const cwd = workingDir || process.cwd();

    return new Promise((resolve, reject) => {
      const [cmd, ...args] = command.split(" ");
      const child = spawn(cmd, args, {
        stdio: "inherit",
        shell: true,
        cwd,
      });

      let errorMsg = "";

      child.on("error", (error) => {
        errorMsg += error.message;
      });

      child.on("close", (code) => {
        if (code === 0) {
          resolve(`命令执行成功`);
        } else {
          resolve(`命令执行失败，退出码: ${code}${errorMsg ? "\n错误: " + errorMsg : ""}`);
        }
      });
    });
  },
  {
    name: "execute_command",
    description: "执行命令",
    schema: z.object({
      command: z.string().describe("要执行的命令"),
      workingDir: z.string().describe("工作目录"),
    }),
  },
);

const listDirectoryTool = tool(
  async ({ dirPath }) => {
    return new Promise((resolve, reject) => {
      fs.readdir(dirPath, { withFileTypes: true }, (err, files) => {
        if (err) {
          reject(`列出目录失败: ${err.message}`);
        } else {
          const fileList = files.map((file) => file.name);
          resolve(`目录 ${dirPath} 中的文件:\n${fileList.join("\n")}`);
        }
      });
    });
  },
  {
    name: "list_directory",
    description: "列出当前目录下的文件和文件夹",
    schema: z.object({
      dirPath: z.string().describe("要列出的目录路径"),
    }),
  },
);

const readFileTool = tool(
  async ({ filePath }) => {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, { encoding: "utf-8" }, (err, data) => {
        if (err) {
          reject(`读取文件失败: ${err.message}`);
        } else {
          resolve(`文件内容:\n${data}`);
        }
      });
    });
  },
  {
    name: "read_file",
    description: "读取指定路径文件的内容",
    schema: z.object({
      filePath: z.string().describe("要读取的文件路径"),
    }),
  },
);

const writeFileTool = tool(
  async ({ filePath, content }) => {
    return new Promise((resolve, reject) => {
      const exists = fs.existsSync(path.dirname(filePath));
      if (!exists) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
      }

      fs.writeFile(filePath, content, { encoding: "utf-8" }, (err) => {
        if (err) {
          reject(`写入文件失败: ${err.message}`);
        } else {
          resolve(`文件写入成功`);
        }
      });
    });
  },
  {
    name: "write_file",
    description: "写入内容到指定路径文件",
    schema: z.object({
      filePath: z.string().describe("要写入的文件路径"),
      content: z.string().describe("要写入的内容"),
    }),
  },
);

export { executeCommandTool, listDirectoryTool, readFileTool, writeFileTool };
