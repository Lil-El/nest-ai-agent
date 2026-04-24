import "dotenv/config";
import { MilvusClient, MetricType } from "@zilliz/milvus2-sdk-node";
import { OpenAIEmbeddings } from "@langchain/openai";

const COLLECTION_NAME = "ai_diary";

const VECTOR_DIMENSION = 1024;

const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
  model: process.env.EMBEDDINGS_MODEL_NAME,
  dimensions: VECTOR_DIMENSION,
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

    const query = await getEmbedding("我想看看关于户外活动的日记");

    const result = await client.search({
      collection_name: COLLECTION_NAME,
      vector: query,
      limit: 2,
      metric_type: MetricType.COSINE,
      output_fields: ["id", "content", "date", "mood", "tags"],
    });

    result.results.forEach((item, index) => {
      console.log(`Result ${index + 1}:`);
      console.log(`ID: ${item.id}`);
      console.log(`Content: ${item.content}`);
      console.log(`Date: ${item.date}`);
      console.log(`Mood: ${item.mood}`);
      console.log(`Tags: ${item.tags}`);
      console.log("----------------------------------\n");
    });
  } catch (error) {
    console.error(error);
  }
}

main();