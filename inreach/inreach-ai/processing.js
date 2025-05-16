const fs = require('fs');
const path = require('path');
const axios = require('axios');

/**
 * ✂️ Clean and chunk text with overlap for vectorization
 */
function cleanAndChunkText(text, chunkSize = 1000, overlap = 200) {
  const cleanedText = text.replace(/\s+/g, ' ').trim();
  const chunks = [];
  let start = 0;

  while (start < cleanedText.length) {
    const end = Math.min(start + chunkSize, cleanedText.length);
    const chunk = cleanedText.slice(start, end);
    chunks.push(chunk);
    start += chunkSize - overlap;
  }

  return chunks;
}

/**
 * 📐 Compute cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
  const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, val) => sum + val ** 2, 0));
  const magB = Math.sqrt(vecB.reduce((sum, val) => sum + val ** 2, 0));
  return dot / (magA * magB);
}

/**
 * 🧠 Embed text using Ollama's /api/embeddings
 */
async function embedText(text) {
  const res = await axios.post('http://localhost:11434/api/embeddings', {
    model: 'nomic-embed-text',
    prompt: text,
  });

  return res.data.embedding;
}

// 🛠️ File paths
const inputFilePath = path.join(__dirname, 'data', 'podcasts.txt');
const chunksFilePath = path.join(__dirname, 'data', 'chunks.json');

// 🚀 Main
(async () => {
  if (!fs.existsSync(inputFilePath)) {
    console.error('❌ Input file not found.');
    return;
  }

  const data = fs.readFileSync(inputFilePath, 'utf8');
  const chunks = cleanAndChunkText(data);
  const results = [];

  for (const chunk of chunks) {
    const embedding = await embedText(chunk);
    results.push({ chunk, embedding });
  }

  fs.writeFileSync(chunksFilePath, JSON.stringify(results, null, 2));
  console.log(`✅ Saved ${results.length} embedded chunks to ${chunksFilePath}`);
})();
