import "dotenv/config";
import { RouterRunnable, RunnableLambda } from "@langchain/core/runnables";

const toUpperCase = RunnableLambda.from((input) => input.toUpperCase());
const reverseText = RunnableLambda.from((input) => input.split("").reverse().join(""));

// RouterRunnable 根据输入的路由信息，动态选择执行哪个 runnable
const router = new RouterRunnable({
  runnables: {
    toUpperCase,
    reverseText,
  },
});

// invoke 时传入路由信息，告诉 RouterRunnable 选择哪个 runnable 来处理输入
const result1 = await router.invoke({ key: "toUpperCase", input: "hello world" });
const result2 = await router.invoke({ key: "reverseText", input: "hello world" });

console.log(result1);
console.log(result2);