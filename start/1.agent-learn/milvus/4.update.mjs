import "dotenv/config";
import { MilvusClient } from "@zilliz/milvus2-sdk-node";
import { OpenAIEmbeddings } from "@langchain/openai";

const COLLECTION_NAME = "ai_diary";

const VECTOR_DIMENSION = 1024;

const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.EMBEDDINGS_MODEL_NAME,
  configuration: {
    baseURL: process.env.EMBEDDINGS_BASE_URL,
  },
});

const client = new MilvusClient({
  address: "localhost:19530",
});

async function getEmbedding(text) {
  return await embeddings.embedQuery(text);
}

async function main() {
  try {
    await client.connectPromise;

    const ID = "diary_001";
    const content = {
      id: ID,
      content: "今天下了一整天的雨，心情很糟糕。工作上遇到了很多困难，感觉压力很大。一个人在家，感觉特别孤独。",
      date: "2026-01-10",
      mood: "sad",
      tags: ["生活", "散步", "朋友"],
    };

    const vector = await getEmbedding(content.content);

    const data = { ...content, vector };

    const result = await client.upsert({
      collection_name: COLLECTION_NAME,
      data: [data],
    });

    console.log("Data upserted:", result);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();