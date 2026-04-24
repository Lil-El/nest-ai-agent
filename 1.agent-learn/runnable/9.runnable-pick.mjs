import "dotenv/config";
import { RunnablePick, RunnableLambda, RunnableSequence } from "@langchain/core/runnables";

const input = {
  name: "Yann.",
  age: 18,
  city: "Xian",
};

const chain = RunnableSequence.from([
  (input) => ({
    ...input,
    fullInfo: `${input.name} is ${input.age} years old and lives in ${input.city}.`,
  }),
  new RunnablePick(["name", "fullInfo"]),
]);

console.log(await chain.invoke(input));
