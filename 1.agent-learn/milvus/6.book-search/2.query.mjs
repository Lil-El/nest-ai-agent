import "dotenv/config";
import { MilvusClient, MetricType } from "@zilliz/milvus2-sdk-node";
import { OpenAIEmbeddings } from "@langchain/openai";

const COLLECTION_NAME = "book_collection";

const VECTOR_DIMENSION = 1024;

const client = new MilvusClient({
  address: "localhost:19530",
});

const embeddings = new OpenAIEmbeddings({
  model: process.env.EMBEDDINGS_MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
  dimensions: VECTOR_DIMENSION,
});

async function getEmbedding(text) {
  return await embeddings.embedQuery(text);
}

async function main() {
  try {
    await client.connectPromise;

    // 确保集合已加载
    try {
      await client.loadCollection({ collection_name: COLLECTION_NAME });
    } catch (error) {
      // 如果已经加载，会报错，忽略即可
      if (!error.message.includes("already loaded")) {
        throw error;
      }
    }

    const queryEmbedding = await getEmbedding(`板块构造运动的一个关键问题在于什么？`);

    const searchResult = await client.search({
      collection_name: COLLECTION_NAME,
      vector: queryEmbedding,
      limit: 5,
      metric_type: MetricType.COSINE,
      output_fields: ["id", "book_id", "chapter_number", "index", "content"],
    });

    if (searchResult.status.error_code !== "Success") {
      console.error("Search failed:", searchResult.status.reason);
    }

    console.log(`Found ${searchResult.results.length} results:\n`);
  } catch (error) {
    console.error(error);
  }
}

main();
