import "dotenv/config";
import { RunnableEach, RunnableLambda, RunnableSequence } from "@langchain/core/runnables";

const toUpperCase = RunnableLambda.from((input) => input.toUpperCase());
const addGreeting = RunnableLambda.from((input) => `Hello, ${input}!`);

const processItem = RunnableSequence.from([toUpperCase, addGreeting]);

const chain = new RunnableEach({
  bound: processItem,
});

console.log(await chain.invoke(["Mino.", "Yann."]));
