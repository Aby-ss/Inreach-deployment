// ai/processing.js

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');
const { ChromaClient } = require('chromadb');

// Load environment variables
dotenv.config();

// Setup OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Setup ChromaDB client
const chroma = new ChromaClient();

// 🔧 Clean and Chunk the input text
async function preprocessText(filePath) {
  const rawText = fs.readFileSync(filePath, 'utf-8');

  const cleanedText = rawText
    .replace(/\n+/g, ' ')      // Remove excess newlines
    .replace(/–|—/g, '-')      // Normalize dashes
    .replace(/\s+/g, ' ')      // Remove extra spaces
    .trim();

  const chunks = [];
  const chunkSize = 500;
  for (let i = 0; i < cleanedText.length; i += chunkSize) {
    chunks.push(cleanedText.slice(i, i + chunkSize));
  }

  return chunks;
}

// 🧠 Embed and Store vectors in Chroma
async function embedAndStore(chunks) {
  const collection = await chroma.getOrCreateCollection({
    name: 'podcasts',
  });

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: chunk,
    });

    const vector = response.data[0].embedding;

    await collection.add({
      ids: [`chunk-${i}`],
      embeddings: [vector],
      metadatas: [{ chunkIndex: i }],
      documents: [chunk],
    });

    console.log(`✅ Embedded and stored chunk ${i + 1}/${chunks.length}`);
  }
}

// 🚀 Main
(async () => {
  const filePath = path.join(__dirname, 'data', 'podcasts.txt');
  const chunks = await preprocessText(filePath);
  await embedAndStore(chunks);
  console.log('✅ All chunks processed and stored.');
})();
