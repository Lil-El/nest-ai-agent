import "dotenv/config";
import { RunnableBranch, RunnableLambda } from "@langchain/core/runnables";

// 条件判断函数
const isPositive = RunnableLambda.from((input) => input > 0);
const isNegative = RunnableLambda.from((input) => input < 0);
const isEven = RunnableLambda.from((input) => input % 2 === 0);

// 分支执行函数
const handlePositive = RunnableLambda.from((input) => `正数：${input} + 10 = ${input + 10}`);
const handleNegative = RunnableLambda.from((input) => `负数：${input} - 10 = ${input - 10}`);
const handleEven = RunnableLambda.from((input) => `偶数：${input} * 2 = ${input * 2}`);
const handleOther = RunnableLambda.from((input) => `默认：${input}`);

const branch = RunnableBranch.from([
  [isPositive, handlePositive],
  [isNegative, handleNegative],
  [isEven, handleEven],
  handleOther,
]);

const testCases = [5, -3, 4, 0, "yann"];

// 这里分别对正数、负数、偶数等做不同处理，也就是 if else 的逻辑。
for (const testCase of testCases) {
  const result = await branch.invoke(testCase);
  console.log(`输入：${testCase} -> 输出：${result}`);
}
