import "dotenv/config";
import "cheerio";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";

const model = new ChatOpenAI({
  model: "qwen-plus",
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
  model: "text-embedding-v3",
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL,
  },
});

const cheerioLoader = new CheerioWebBaseLoader("https://juejin.cn/post/7233327509919547452", {
  selector: ".main-area p",
});

const documents = await cheerioLoader.load();

console.assert(documents.length === 1);
console.log(`Total characters: ${documents[0].pageContent.length}`);

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 50,
  separators: ["。", "！", "？"],
});

// textSplitter.fromLanguage("js") 支持代码分割: js/go/java/...
const splitDocuments = await textSplitter.splitDocuments(documents);

const vectorStore = await MemoryVectorStore.fromDocuments(splitDocuments, embeddings);

const retriever = vectorStore.asRetriever({ k: 2 });

const questions = ["父亲的去世对作者的人生态度产生了怎样的根本性逆转？"];

for (const question of questions) {
  console.log("=".repeat(80));
  console.log(`问题: ${question}`);
  console.log("=".repeat(80));

  // 1.
  const retrievedDocs = await retriever.invoke(question);

  // 2.
  const query = await embeddings.embedQuery(question);
  const docsWithScore = await vectorStore.similaritySearchVectorWithScore(query, 2);
  console.log("docsWithScore: ", docsWithScore);
  console.log("---".repeat(20));

  // 3.
  const scoredResults = await vectorStore.similaritySearchWithScore(question, 2);
  console.log("scoredResults: ", scoredResults);
  console.log("---".repeat(20));

  retrievedDocs.forEach((doc, i) => {
    const scoredResult = scoredResults.find(([scoredDoc]) => scoredDoc.pageContent === doc.pageContent);
    const score = scoredResult ? scoredResult[1] : null;
    console.log(`\n[文档 ${i + 1}] 相似度分数: ${score}`);
    const similarity = score !== null ? (1 - score).toFixed(4) : "N/A";
    console.log(`\n[文档 ${i + 1}] 相似度: ${similarity}`);
    console.log(`内容: ${doc.pageContent}`);
    console.log("-".repeat(40));
  });

  const context = retrievedDocs.map((doc, i) => `[片段${i + 1}]\n${doc.pageContent}`).join("\n----\n");

  const prompt = `你是一个文章辅助阅读助手，根据文章内容来解答：

  文章内容：
  ${context}

  问题: ${question}

  你的回答:`;

  const response = await model.invoke(prompt);
  console.log(`回答: ${response.content}`);
  console.log("\n\n");
}
