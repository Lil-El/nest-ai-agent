import { existsSync, unlinkSync } from "node:fs";

import { START, END, Annotation, StateGraph, MemorySaver } from "@langchain/langgraph";
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";

const StateAnnotation = Annotation.Root({
  visitCount: Annotation({
    reducer: (_prev, next) => {
      console.log("reducer:", _prev, next);
      return next;
    }, // prev = 0, next = 1,
    default: () => 0,
  }),
  message: Annotation({
    reducer: (_prev, next) => next, // prev = "", next = 第一次访问,
    default: () => "",
  }),
});

function recordVisit(state) {
  console.log("recordVisit");
  const visitCount = state.visitCount + 1;
  const message = visitCount === 1 ? "第一次访问" : `第 ${visitCount} 次访问`;
  return { visitCount, message };
}

const graph = new StateGraph(StateAnnotation)
  .addNode("recordVisit", recordVisit)
  .addEdge(START, "recordVisit")
  .addEdge("recordVisit", END);

const dbPath = "./db.sqlite";

// 删除数据库文件
if (existsSync(dbPath)) {
  unlinkSync(dbPath);
}

const checkpointer = SqliteSaver.fromConnString(dbPath);
const app = graph.compile({ checkpointer });

const user1 = { configurable: { thread_id: "用户1" } };

const res1 = await app.invoke({}, user1);
const res2 = await app.invoke({}, user1);
const res3 = await app.invoke({}, user1);
