import "dotenv/config";
import { RunnableMap, RunnableLambda } from "@langchain/core/runnables";
import { PromptTemplate } from "@langchain/core/prompts";

const addOne = RunnableLambda.from((input) => input.num + 1);
const multiplyByTwo = RunnableLambda.from((input) => input.num * 2);
const square = RunnableLambda.from((input) => input.num * input.num);

const greetTemplate = PromptTemplate.fromTemplate("你好，{name}！");
const weatherTemple = PromptTemplate.fromTemplate("今天天气{weather}。");

// 创建 RunnableMap，并行执行多个 runnable
const runnable = RunnableMap.from({
  add: addOne,
  multiply: multiplyByTwo,
  square,

  greet: greetTemplate,
  weather: weatherTemple,
});

const input = { name: "Yan", weather: "暴风雨", num: 3 };

const result = await runnable.invoke(input);

console.log(result);
