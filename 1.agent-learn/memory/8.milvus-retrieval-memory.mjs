import "dotenv/config";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { MilvusClient, MetricType } from "@zilliz/milvus2-sdk-node";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";

const COLLECTION_NAME = "conversation_memory";
const VECTOR_DIMENSION = 1024;

const model = new ChatOpenAI({
  model: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

const embeddings = new OpenAIEmbeddings({
  model: process.env.EMBEDDINGS_MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_API_BASE_URL,
  },
  dimensions: VECTOR_DIMENSION,
});

const client = new MilvusClient("localhost:19530");

async function getEmbedding(text) {
  return await embeddings.embedQuery(text);
}

async function retrieveRelevantConversations(query, topK = 2) {
  const vector = await getEmbedding(query);

  const searchResults = await client.search({
    collection_name: COLLECTION_NAME,
    vector,
    limit: topK,
    metric_type: MetricType.COSINE,
    output_fields: ["id", "content", "round", "timestamp"],
  });

  return searchResults.results;
}

async function main() {
  await client.connectPromise;

  await client.loadCollection({ collection_name: COLLECTION_NAME });

  const history = new InMemoryChatMessageHistory();

  const conversations = [
    { input: "我之前提到的机器学习项目进展如何？" },
    { input: "我周末经常做什么？" },
    { input: "我的职业是什么？" },
  ];

  for (let i = 0; i < conversations.length; i++) {
    const conv = conversations[i];

    console.log(`\n🔍 查询: ${conv.input}`);

    const results = await retrieveRelevantConversations(conv.input);

    // 构建上下文
    const context = results.map((result) => `[历史对话${result.round}内容]：${result.content}`).join("\n");
    console.log(`\n📂 检索到的相关历史对话:\n${context}`);

    // 构建提示词
    const prompt = `请根据以下历史对话内容回答问题：\n\n${context}\n\n问题：${conv.input}\n\n回答：`;

    // 调用模型
    console.log(`\n🤖 模型正在思考...`);
    const response = await model.invoke(prompt);
    console.log(`\n🤖 模型回答: ${response.content}`);

    // 将当前对话和模型回答保存到历史中
    await history.addMessage(new HumanMessage(conv.input));
    await history.addMessage(response);

    // 将当前对话内容插入到Milvus中
    const conversationContent = `用户: ${conv.input}\n助手: ${response.content}`;
    const convId = `conv_${Date.now()}_${i + 1}`;
    const vector = await getEmbedding(conversationContent);
    await client.insert({
      collection_name: COLLECTION_NAME,
      data: [
        {
          id: convId,
          vector,
          content: conversationContent,
          round: i + 1,
          timestamp: new Date().toISOString(),
        },
      ],
    });
    console.log(`\n✅ 已将对话内容插入到Milvus`);
  }
}

main();
