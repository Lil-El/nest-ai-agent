import { spawn } from "child_process";

const command = "echo. & echo. | pnpm create vite react-todo-app --template react-ts";

const [cmd, ...args] = command.split(" ");

const child = spawn(cmd, args, {
  cwd: process.cwd(),
  stdio: "inherit", // 继承父进程的输入输出
  shell: true, // 使用 shell 来解析命令
});

let errorMsg = "";

child.on("error", (error) => {
  errorMsg = error.message;
});

child.on("close", (code) => {
  if (code === 0) {
    process.exit(0);
  } else {
    if (errorMsg) {
      console.error(`命令执行失败: ${errorMsg}`);
    }
    process.exit(code || 1);
  }
});
