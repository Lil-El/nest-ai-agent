import "dotenv/config";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { MilvusClient, MetricType } from "@zilliz/milvus2-sdk-node";
import { ToolMessage, HumanMessage } from "@langchain/core/messages";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableLambda, RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

const COLLECTION_NAME = "book_collection";
const VECTOR_DIMENSION = 1024;

const model = new ChatOpenAI({
  modelName: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0.7,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
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

const prompt = new PromptTemplate({
  template: `你是一个图书内容检索助手。根据用户的查询，从以下内容中检索相关信息：
  {retrieved_content}
  用户的问题是：{query}`,
  inputVariables: ["retrieved_content", "query"],
});

async function getEmbedding(text) {
  return await embeddings.embedQuery(text);
}

async function retrieveContent(query) {
  const searchResult = await client.search({
    collection_name: COLLECTION_NAME,
    vector: await getEmbedding(query),
    limit: 3,
    metric_type: MetricType.COSINE,
    output_fields: ["id", "book_id", "chapter_number", "index", "content"],
  });

  return searchResult.results;
}

const ragChain = RunnableSequence.from([
  new RunnableLambda({
    func: async (input) => {
      const { query } = input;
      const contentList = await retrieveContent(query);
      return {
        query,
        contentList,
      };
    },
  }),
  RunnableLambda.from(async (input) => {
    const { query, contentList } = input;

    // 打印检索结果
    console.log("=".repeat(80));
    console.log(`问题: ${query}`);
    console.log("=".repeat(80));
    console.log("\n【检索相关内容】");

    contentList.forEach((item, i) => {
      console.log(`\n[片段 ${i + 1}] 相似度: ${item.score ?? "N/A"}`);
      console.log(`书籍: ${item.book_id}`);
      console.log(`章节: 第 ${item.chapter_number} 章`);
      console.log(`片段索引: ${item.index}`);
      const content = item.content ?? "";
      console.log(`内容: ${content.substring(0, 200)}${content.length > 200 ? "..." : ""}`);
    });

    const retrieved_content = contentList
      .map((item, i) => {
        return `[片段 ${i + 1}]
章节: 第 ${item.chapter_num} 章
内容: ${item.content}`;
      })
      .join("\n\n━━━━━\n\n");

    return {
      query,
      retrieved_content,
    };
  }),
  prompt,
  model,
  new StringOutputParser(),
]);

async function run(query) {
  await client.connectPromise;

  await client.loadCollection({
    collection_name: COLLECTION_NAME,
  });

  const stream = await ragChain.stream({
    query,
  });

  console.log("=".repeat(80));
  console.log("\n【AI 流式回答】\n");

  for await (const chunk of stream) {
    process.stdout.write(chunk);
  }
}

run("黑洞是如何形成的？");
