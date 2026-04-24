import "dotenv/config";
import { MilvusClient } from "@zilliz/milvus2-sdk-node";
import { OpenAIEmbeddings } from "@langchain/openai";

const COLLECTION_NAME = "ai_diary";

const VECTOR_DIMENSION = 1024;

const embeddings = new OpenAIEmbeddings({
  model: process.env.EMBEDDINGS_MODEL_NAME,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
  apiKey: process.env.OPENAI_API_KEY,
  dimensions: VECTOR_DIMENSION,
});

const client = new MilvusClient({
  address: "localhost:19530",
});

async function main() {
  try {
    await client.connectPromise;
    const id = "diary_001";
    const result1 = await client.delete({
      collection_name: COLLECTION_NAME,
      filter: `id == "${id}"`,
    });
    console.log(result1);

    const deleteIds = ["diary_002", "diary_003"];
    const idsStr = deleteIds.map((id) => `"${id}"`).join(", ");
    const result2 = await client.delete({
      collection_name: COLLECTION_NAME,
      filter: `id in [${idsStr}]`,
    });
    console.log(result2);

    const result3 = await client.delete({
      collection_name: COLLECTION_NAME,
      filter: `mood == "sad"`,
    });
    console.log(result3);
  } catch (error) {
    console.error(error);
  }
}

main();
