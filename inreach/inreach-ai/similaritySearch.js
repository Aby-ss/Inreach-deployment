const fs = require('fs');
const path = require('path');
const use = require('@tensorflow-models/universal-sentence-encoder');
const tf = require('@tensorflow/tfjs-node');
const readline = require('readline');

// 📂 Load chunks from file
const chunksPath = path.join(__dirname, 'data', 'chunks.json');
const chunks = JSON.parse(fs.readFileSync(chunksPath, 'utf8'));


function cosineSimilarity(vecA, vecB) {
  const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dot / (normA * normB);
}


async function embedChunks(model, chunks) {
  const texts = chunks.map(chunk => chunk.chunk || chunk); // If plain strings or objects
  const embeddingsTensor = await model.embed(texts);
  return embeddingsTensor.array();
}


async function semanticSearch(query, chunkEmbeddings, chunks, model) {
  const queryEmbedding = await model.embed([query]);
  const queryVec = (await queryEmbedding.array())[0];

  // 🧠 Calculate similarity for each chunk
  const scoredChunks = chunkEmbeddings.map((embedding, index) => {
    return {
      chunk: chunks[index].chunk || chunks[index],
      score: cosineSimilarity(queryVec, embedding)
    };
  });

  const topChunks = scoredChunks.sort((a, b) => b.score - a.score).slice(0, 3);
  return topChunks;
}


function promptQuery(callback) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('🔍 Enter your search query: ', async (query) => {
    await callback(query);
    rl.close();
  });
}


(async () => {
  const model = await use.load();
  console.log('✅ USE model loaded...');

  console.log('📊 Embedding all chunks...');
  const chunkEmbeddings = await embedChunks(model, chunks);

  promptQuery(async (query) => {
    console.log('\n🔎 Searching for:', query);
    const results = await semanticSearch(query, chunkEmbeddings, chunks, model);

    results.forEach((res, i) => {
      console.log(`\n#${i + 1} (Score: ${res.score.toFixed(4)})\n${res.chunk.slice(0, 500)}...`);
    });
  });
})();
