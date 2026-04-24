import "dotenv/config";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MilvusClient, DataType, IndexType, MetricType } from "@zilliz/milvus2-sdk-node";

const COLLECTION_NAME = "conversation_memory";
const VECTOR_DIMENSION = 1024;

const embeddings = new OpenAIEmbeddings({
  model: process.env.EMBEDDINGS_MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
  dimensions: VECTOR_DIMENSION,
});

const client = new MilvusClient("localhost:19530");

async function getEmbedding(text) {
  return await embeddings.embedQuery(text);
}

async function main() {
  await client.connectPromise;

  await client.createCollection({
    collection_name: COLLECTION_NAME,
    fields: [
      { name: "id", data_type: DataType.VarChar, max_length: 50, is_primary_key: true },
      { name: "vector", data_type: DataType.FloatVector, dim: VECTOR_DIMENSION },
      { name: "content", data_type: DataType.VarChar, max_length: 5000 },
      { name: "round", data_type: DataType.Int64 },
      { name: "timestamp", data_type: DataType.VarChar, max_length: 100 },
    ],
  });

  await client.createIndex({
    collection_name: COLLECTION_NAME,
    field_name: "vector",
    metric_type: MetricType.COSINE,
    index_type: IndexType.IVF_FLAT,
  });

  await client.loadCollection({ collection_name: COLLECTION_NAME });

  const conversations = [
    {
      id: "conv_001",
      content: "用户: 我叫赵六，是一名数据科学家\n助手: 很高兴认识你，赵六！数据科学是一个很有趣的领域。",
      round: 1,
      timestamp: new Date().toISOString(),
    },
    {
      id: "conv_002",
      content: "用户: 我最近在研究机器学习算法\n助手: 机器学习确实很有意思，你在研究哪些算法呢？",
      round: 2,
      timestamp: new Date().toISOString(),
    },
    {
      id: "conv_003",
      content: "用户: 我喜欢打篮球和看电影\n助手: 运动和文化娱乐都是很好的爱好！",
      round: 3,
      timestamp: new Date().toISOString(),
    },
    {
      id: "conv_004",
      content: "用户: 我周末经常去电影院\n助手: 看电影是很好的放松方式。",
      round: 4,
      timestamp: new Date().toISOString(),
    },
    {
      id: "conv_005",
      content: "用户: 我的职业是软件工程师\n助手: 软件工程师是个很有前景的职业！",
      round: 5,
      timestamp: new Date().toISOString(),
    },
  ];

  const data = await Promise.all(
    conversations.map(async (cov) => ({
      ...cov,
      vector: await getEmbedding(cov.content),
    })),
  );

  client.insert({
    collection_name: COLLECTION_NAME,
    data,
  });
}

main();
