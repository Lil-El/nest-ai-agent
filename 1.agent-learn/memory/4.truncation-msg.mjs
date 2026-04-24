import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { HumanMessage, AIMessage, trimMessages } from "@langchain/core/messages";
import { getEncoding } from "js-tiktoken";

// 1. 按照消息数量截断
async function messageCountTruncation() {
  const history = new InMemoryChatMessageHistory();
  const Messages = 4;

  const messages = [
    { type: "human", content: "我叫张三" },
    { type: "ai", content: "你好张三，很高兴认识你！" },
    { type: "human", content: "我今年25岁" },
    { type: "ai", content: "25岁正是青春年华，有什么我可以帮助你的吗？" },
    { type: "human", content: "我喜欢编程" },
    { type: "ai", content: "编程很有趣！你主要用什么语言？" },
    { type: "human", content: "我住在北京" },
    { type: "ai", content: "北京是个很棒的城市！" },
    { type: "human", content: "我的职业是软件工程师" },
    { type: "ai", content: "软件工程师是个很有前景的职业！" },
  ];

  await history.addMessages(
    messages.map((msg) => (msg.type === "human" ? new HumanMessage(msg.content) : new AIMessage(msg.content))),
  );

  let allMessages = await history.getMessages();

  const trimmedMessages = allMessages.slice(-Messages);

  console.log("按照消息数量截断后的消息：", trimmedMessages);
}

// 计算消息数组的总token数量
async function countTokens(messages, encoder) {
  let total = 0;
  for (const msg of messages) {
    const content = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);
    total += encoder.encode(content).length;
  }
  return total;
}

// 2. 按照token数量截断
async function tokenCountTruncation() {
  const history = new InMemoryChatMessageHistory();
  const maxTokens = 100;

  const encoder = getEncoding("cl100k_base");

  const messages = [
    { type: "human", content: "我叫李四" },
    { type: "ai", content: "你好李四，很高兴认识你！" },
    { type: "human", content: "我是一名设计师" },
    { type: "ai", content: "设计师是个很有创造力的职业！你主要做什么类型的设计？" },
    { type: "human", content: "我喜欢艺术和音乐" },
    { type: "ai", content: "艺术和音乐都是很好的爱好，它们能激发创作灵感。" },
    { type: "human", content: "我擅长 UI/UX 设计" },
    { type: "ai", content: "UI/UX 设计非常重要，好的用户体验能让产品更成功！" },
  ];

  await history.addMessages(
    messages.map((msg) => (msg.type === "human" ? new HumanMessage(msg.content) : new AIMessage(msg.content))),
  );

  let allMessages = await history.getMessages();

  const trimmedMessages = await trimMessages(allMessages, {
    maxTokens: maxTokens,
    tokenCounter: async (msgs) => countTokens(msgs, encoder),
    strategy: "last",
  });

  const totalTokens = await countTokens(trimmedMessages, encoder);

  console.log(`总 token 数: ${totalTokens}/${maxTokens}`);
  console.log(`保留消息数量: ${trimmedMessages.length}`);
  console.log(
    "保留的消息:",
    trimmedMessages
      .map((m) => {
        const content = typeof m.content === "string" ? m.content : JSON.stringify(m.content);
        const tokens = encoder.encode(content).length;
        return `${m.constructor.name} (${tokens} tokens): ${content}`;
      })
      .join("\n  "),
  );
}

async function main() {
  await messageCountTruncation();
  console.log("\n-----------------------------\n");
  await tokenCountTruncation();
}

main();
