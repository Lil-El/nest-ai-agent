import "dotenv/config";
import { RunnableLambda, RunnablePassthrough, RunnableSequence, RunnableMap } from "@langchain/core/runnables";

const chain = RunnableSequence.from([
  RunnableLambda.from((input) => ({ concept: input })),
  RunnableMap.from({
    original: new RunnablePassthrough(), // 通过 RunnablePassthrough 直接返回原始输入
    processed: RunnableLambda.from((obj) => ({
      concept: obj.concept,
      upper: obj.concept.toUpperCase(),
      length: obj.concept.length,
    })),
  }),
]);

console.log(await chain.invoke(`Hello Yann`));

// 简化版本：
const chain1 = RunnableSequence.from([
  (input) => ({ concept: input }),
  {
    original: new RunnablePassthrough(),
    processed: (obj) => ({
      concept: obj.concept,
      upper: obj.concept.toUpperCase(),
      length: obj.concept.length,
    }),
  },
]);

console.log(await chain1.invoke(`Hello Yann`));

// 保留并扩展属性：
const chain2 = RunnableSequence.from([
  (input) => ({ concept: input }),
  RunnablePassthrough.assign({
    original: new RunnablePassthrough(),
    processed: (obj) => ({
      concept: obj.concept,
      upper: obj.concept.toUpperCase(),
      length: obj.concept.length,
    }),
  }),
]);

console.log(await chain2.invoke(`Hello Yann`));