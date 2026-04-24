import "dotenv/config";
import { MilvusClient, MetricType } from "@zilliz/milvus2-sdk-node";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";

const COLLECTION_NAME = "book_collection";

const VECTOR_DIMENSION = 1024;

const model = new ChatOpenAI({
  model: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
  temperature: 0.2,
});

const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.EMBEDDINGS_MODEL_NAME,
  configuration: {
    basePath: process.env.EMBEDDINGS_API_URL,
  },
  dimensions: VECTOR_DIMENSION,
});

const client = new MilvusClient({
  address: "localhost:19530",
});

async function getEmbeddings(text) {
  return await embeddings.embedQuery(text);
}

async function retrieveContent(question) {
  try {
    const queryVec = await getEmbeddings(question);
    const searchResult = await client.search({
      collection_name: COLLECTION_NAME,
      vector: queryVec,
      limit: 3,
      output_fields: ["id", "book_id", "chapter_number", "index", "content"],
    });
    return searchResult.results;
  } catch (error) {
    console.error("Error:", error.message);
  }
}

async function main() {
  try {
    await client.connectPromise;

    await client.loadCollection({ collection_name: COLLECTION_NAME });

    const query = `黑洞是如何形成的？`;

    const results = await retrieveContent(query);

    const context = results.map((item, index) => `[片段${index + 1}内容]：${item.content}`).join("\n\n━━━━━\n\n");

    const prompt = `请根据以下内容回答问题：\n\n${context}\n\n问题：${query}\n\n回答：`;

    const response = await model.invoke(prompt);

    console.log("回答：", response.text);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();
