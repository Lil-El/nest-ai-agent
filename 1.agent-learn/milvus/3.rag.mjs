import "dotenv/config";
import { MilvusClient, MetricType } from "@zilliz/milvus2-sdk-node";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";

const COLLECTION_NAME = "ai_diary";

const VECTOR_DIMENSION = 1024;

const model = new ChatOpenAI({
  model: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
  temperature: 0.7,
});

const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.EMBEDDINGS_MODEL_NAME,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
  dimensions: VECTOR_DIMENSION,
});

const client = new MilvusClient({
  address: "localhost:19530",
});

async function getEmbedding(text) {
  return await embeddings.embedQuery(text);
}

async function retrieveData(question, k = 2) {
  try {
    const queryVec = await getEmbedding(question);
    const searchResults = await client.search({
      collection_name: COLLECTION_NAME,
      vector: queryVec,
      limit: k,
      metric_type: MetricType.COSINE,
      output_fields: ["id", "content", "date", "mood", "tags"],
    });
    return searchResults.results;
  } catch (error) {
    console.error("Error:", error.message);
  }
}

async function answerDiaryQuestion(question, k = 2) {
  try {
    const retrievedData = await retrieveData(question, k);

    if (retrievedData.length === 0) {
      console.log("No relevant diary entries found.");
      return;
    }

    const context = retrievedData
      .map((diary, i) => {
        return `[日记 ${i + 1}]
日期: ${diary.date}
心情: ${diary.mood}
标签: ${diary.tags?.join(", ")}
内容: ${diary.content}`;
      })
      .join("\n\n━━━━━\n\n");

    const prompt = `你是我的个人日记助手，以下是我最近的日记内容：\n\n${context}\n\n请根据这些日记内容回答以下问题：\n\n${question}\n\n请尽量详细地回答，并结合具体的日记内容。`;
    const response = await model.invoke(prompt);
    console.log(response.content);
    return response.content;
  } catch (error) {
    console.error("Error:", error.message);
  }
}

async function main() {
  try {
    await client.connectPromise;

    await answerDiaryQuestion("我最近做了什么让我感到快乐的事情？");
  } catch (error) {
    console.error(error);
  }
}

main();
