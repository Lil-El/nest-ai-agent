import "dotenv/config";
import { RunnableLambda, RunnableSequence } from "@langchain/core/runnables";

// 将函数封装成一个Runnable对象
const addOne = RunnableLambda.from((input) => input + 1);

// 将函数封装成一个Runnable对象
const multiplyByTwo = RunnableLambda.from((input) => input * 2);

const chain = RunnableSequence.from([addOne, multiplyByTwo, addOne]);

console.log(await chain.invoke(5));
