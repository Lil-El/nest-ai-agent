import { Annotation, START, END, StateGraph, MemorySaver, Command, interrupt } from "@langchain/langgraph";
import { createInterface } from "node:readline/promises";

const StateAnnotation = Annotation.Root({
  actionSummary: Annotation({
    reducer: (p, n) => n,
    default: () => "",
  }),
  userInput: Annotation({
    reducer: (p, n) => n,
    default: () => "",
  }),
});

function showTransfer() {
  return {
    actionSummary: "向张三转账 ¥100（模拟，不会真扣款）",
  };
}

function waitConfirm(state) {
  const text = interrupt({
    hint: "终端里输入「确认」或备注后回车，图才会继续",
    actionSummary: state.actionSummary,
  });
  return { userInput: String(text) };
}

const graph = new StateGraph(StateAnnotation)
  .addNode("showTransfer", showTransfer)
  .addNode("waitConfirm", waitConfirm)
  .addEdge(START, "showTransfer")
  .addEdge("showTransfer", "waitConfirm")
  .addEdge("waitConfirm", END)
  .compile({ checkpointer: new MemorySaver() });

const drawable = await graph.getGraphAsync();
const mermaid = drawable.drawMermaid({ withStyles: true });
console.log(mermaid);

const cfg = { configurable: { thread_id: "Yann." } };

const paused = await graph.invoke({}, cfg);

console.log("\n待你确认：", paused.__interrupt__?.[0]?.value);

const rl = createInterface({ input: process.stdin, output: process.stdout });
const line = (await rl.question("> ")).trim();
await rl.close();

if (!line) {
  throw new Error("请输入内容");
}

const done = await graph.invoke(new Command({ resume: line }), cfg);
console.log("\n结果：", done);
