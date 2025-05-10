const fs = require('fs');
const path = require('path');

/**
 * Clean and chunk text intelligently for vectorization.
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
 * Compute cosine similarity between two vectors.
 */
function cosineSimilarity(vecA, vecB) {
  const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, val) => sum + val ** 2, 0));
  const magB = Math.sqrt(vecB.reduce((sum, val) => sum + val ** 2, 0));
  return dot / (magA * magB);
}

// 🔧 File paths
const inputFilePath = path.join(__dirname, 'data', 'podcasts.txt');
const chunksFilePath = path.join(__dirname, 'data', 'chunks.json');
const embeddingsFilePath = path.join(__dirname, 'data', 'embeddings.json');

// 📖 Read and process the file
fs.readFile(inputFilePath, 'utf8', async (err, data) => {
  if (err) return console.error('❌ Error reading file:', err);

  const chunks = cleanAndChunkText(data);
  fs.writeFileSync(chunksFilePath, JSON.stringify(chunks, null, 2));
  console.log(`✅ Wrote ${chunks.length} chunks to ${chunksFilePath}`);

  // 🧠 Load embedding model from @xenova/transformers
  const { pipeline } = await import('@xenova/transformers');
  const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

  const embeddings = [];
  for (const chunk of chunks) {
    const output = await embedder(chunk, { pooling: 'mean', normalize: true });
    embeddings.push(output.data);
  }

  fs.writeFileSync(embeddingsFilePath, JSON.stringify(embeddings, null, 2));
  console.log(`✅ Saved ${embeddings.length} embeddings to ${embeddingsFilePath}`);

  // 🔍 Sample query + similarity search
  const query = 'how to write a good cold email';
  const queryEmbedding = (await embedder(query, {
    pooling: 'mean',
    normalize: true,
  })).data;

  const results = chunks.map((chunk, i) => ({
    chunk,
    score: cosineSimilarity(queryEmbedding, embeddings[i]),
  }));

  results.sort((a, b) => b.score - a.score);
  console.log('\n🔎 Top 3 matching chunks:\n');
  //console.log(results.slice(0, 3));

  console.log('\n📚 Pretty Results:\n');

  results.slice(0, 3).forEach((result, i) => {
    console.log(`🔹 Result ${i + 1}`);
    console.log(`📈 Score: ${result.score.toFixed(4)}`);
    console.log(`📝 Chunk: ${result.chunk.slice(0, 300)}...`); // Limit to 300 chars
    console.log('='.repeat(80)); // Divider
  });
});