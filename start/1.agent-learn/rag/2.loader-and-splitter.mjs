import "dotenv/config";
import "cheerio";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const cheerioLoader = new CheerioWebBaseLoader("https://juejin.cn/post/7233327509919547452", {
  selector: ".main-area p",
});

/**
 * Document: { pageContent: '...', metadata: {} }
 */
const documents = await cheerioLoader.load();

/**
 *  chunkSize 是 400 个字符，然后前后重复 50 个字符。分割符是优先 。 其次 ！？
 */
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 400, // 分块的字符数
  chunkOverlap: 50, // 分块之间的重叠字符数
  separators: ["。", "！", "？"], // 分割符
});

const splitDocuments = await textSplitter.splitDocuments(documents);

console.log(splitDocuments);
