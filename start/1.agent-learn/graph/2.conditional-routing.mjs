import { Annotation, START, END, StateGraph } from "@langchain/langgraph";

const StateAnnotation = Annotation.Root({
  query: Annotation({
    reducer: (_prev, next) => next,
    default: () => "",
  }),
  route: Annotation({
    reducer: (_prev, next) => next,
    default: () => "",
  }),
  answer: Annotation({
    reducer: (_prev, next) => next,
    default: () => "",
  }),
});

const router = (state) => {
  const isMath = /[+\-*/]/.test(state.query);
  return { route: isMath ? "math" : "chat" };
};

const mathNode = (state) => {
  try {
    return { answer: String(eval(state.query)) };
  } catch (error) {
    return { answer: `无法计算: ${error.message}` };
  }
};

const chatNode = (state) => ({ answer: `你说的是：${state.query}` });

const graph = new StateGraph(StateAnnotation)
  .addNode("router", router)
  .addNode("math", mathNode)
  .addNode("chat", chatNode)
  .addEdge(START, "router")
  .addConditionalEdges("router", (state) => state.route, {
    math: "math",
    chat: "chat",
  })
  .addEdge("math", END)
  .addEdge("chat", END)
  .compile();

const drawable = await graph.getGraphAsync();
const mermaid = drawable.drawMermaid();
console.log(mermaid);

const result = await graph.invoke({ query: "1+1" });
console.log(result); // { query: '1+1', route: 'math', answer: '2' }

const result2 = await graph.invoke({ query: "你好" });
console.log(result2); // {  query: '你好', route: 'chat', answer: '你说的是：你好' }
