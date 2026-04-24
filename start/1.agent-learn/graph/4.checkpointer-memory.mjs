import { START, END, Annotation, StateGraph, MemorySaver } from "@langchain/langgraph";

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

// 保存到内存，也可以选择保存到 sqlite 、redis 等
const checkpointer = new MemorySaver();
const app = graph.compile({ checkpointer });

const user1 = { configurable: { thread_id: "用户1" } };
const user2 = { configurable: { thread_id: "用户2" } };

const res1 = await app.invoke({}, user1);
const res2 = await app.invoke({}, user1);
const res3 = await app.invoke({}, user1);
const res4 = await app.invoke({}, user2);

console.log(res1);
console.log(res2);
console.log(res3);
console.log(res4);
