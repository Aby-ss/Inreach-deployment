const axios = require('axios');

// 🧮 Generate embedding using Ollama's built-in embedding API
async function embedText(text) {
  const res = await axios.post('http://localhost:11434/api/embeddings', {
    model: 'nomic-embed-text',
    prompt: text
  });
  return res.data.embedding;
}

// 🧠 Cosine similarity calculator
function cosineSimilarity(vecA, vecB) {
  const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dot / (normA * normB);
}

module.exports = { cosineSimilarity, embedText };
