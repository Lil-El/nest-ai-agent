import "dotenv/config";
import path, { parse } from "path";
import { fileURLToPath } from "url";
import { MilvusClient, DataType, MetricType, IndexType } from "@zilliz/milvus2-sdk-node";
import { OpenAIEmbeddings } from "@langchain/openai";
import { EPubLoader } from "@langchain/community/document_loaders/fs/epub";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const COLLECTION_NAME = "book_collection";
const VECTOR_DIMENSION = 1024;
const CHUNK_SIZE = 500;

// Node.js 使用 __dirname 获取当前文件目录
// ESM 模块中没有 __dirname，可以通过以下方式获取当前文件目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EPUB_FILE = path.join(__dirname, "./第一性原理.epub");

// { root: '', dir: '.', base: '第一性原理.epub', ext: '.epub', name: '第一性原理' }
const BOOK_NAME = parse(EPUB_FILE).name;

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

async function ensureCollection(bookId) {
  try {
    const hasCollection = await client.hasCollection({
      collection_name: COLLECTION_NAME,
    });

    console.log(`Collection "${COLLECTION_NAME}" exists:`, hasCollection.value, "\n");

    if (!hasCollection.value) {
      await client.createCollection({
        collection_name: COLLECTION_NAME,
        fields: [
          { name: "id", data_type: DataType.VarChar, max_length: 255, is_primary_key: true },
          { name: "book_id", data_type: DataType.VarChar, max_length: 255 },
          { name: "book_name", data_type: DataType.VarChar, max_length: 255 },
          { name: "content", data_type: DataType.VarChar, max_length: 10000 },
          { name: "chapter_number", data_type: DataType.Int32 },
          { name: "index", data_type: DataType.Int32 },
          { name: "vector", data_type: DataType.FloatVector, dim: VECTOR_DIMENSION },
        ],
      });

      await client.createIndex({
        collection_name: COLLECTION_NAME,
        field_name: "vector",
        index_type: IndexType.IVF_FLAT,
        metric_type: MetricType.COSINE,
        params: {
          nlist: 1024,
        },
      });

      // 加载集合到内存
      const resStatus = await client.loadCollection({
        collection_name: COLLECTION_NAME,
      });
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

async function insertChunksBatch(chunks, bookId, chapterNumber) {
  try {
    if (chunks.length === 0) return;

    const insertData = await Promise.all(
      chunks.map(async (chunk, index) => {
        const vector = await getEmbedding(chunk);

        return {
          id: `${bookId}_${chapterNumber}_${index}`,
          book_id: bookId,
          book_name: BOOK_NAME,
          chapter_number: chapterNumber,
          index: index,
          content: chunk,
          vector: vector,
        };
      }),
    );

    const result = await client.insert({
      collection_name: COLLECTION_NAME,
      data: insertData,
    });

    return result.insert_cnt;
  } catch (error) {
    console.error("insertChunksBatch Error:", error.status.reason);
  }
}

async function loadAndProcessEPubStreaming(bookId) {
  try {
    const loader = new EPubLoader(EPUB_FILE, {
      splitChapters: true,
    });

    const documents = await loader.load();

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: CHUNK_SIZE,
      chunkOverlap: 50,
    });

    let totalInserted = 0;

    for (let chapterIndex = 0; chapterIndex < documents.length; chapterIndex++) {
      const chapter = documents[chapterIndex];
      const chapterContent = chapter.pageContent;

      const chunks = await textSplitter.splitText(chapterContent);

      if (chunks.length === 0) continue;

      const insertedCount = await insertChunksBatch(chunks, bookId, chapterIndex + 1);

      totalInserted += insertedCount;
    }

    return totalInserted;
  } catch (error) {
    console.error("loadAndProcessEPubStreaming Error:", error.message);
  }
}

async function main() {
  try {
    await client.connectPromise;

    const bookId = `book_1`;

    await ensureCollection(bookId);

    await loadAndProcessEPubStreaming(bookId);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();
