const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const axios = require('axios');
const { ChromaClient } = require('chromadb');

// Load environment variables
dotenv.config();

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

// 🧠 Embed and Store vectors in Chroma using Hugging Face
async function embedAndStore(chunks) {
  const collection = await chroma.getOrCreateCollection({
    name: 'podcasts',
  });

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    const response = await axios.post(
      'https://api-inference.huggingface.co/embeddings/sentence-transformers/all-MiniLM-L6-v2',
      { inputs: chunk },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const vector = response.data; // HF returns just the array

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