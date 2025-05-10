const fs = require('fs');
const path = require('path');
const axios = require('axios');
const readline = require('readline-sync');
const cosineSimilarity = require('cosine-similarity');

const EMBEDDINGS_FILE = path.join(__dirname, 'data', 'chunks.json');
const PODCAST_NOTES_DIR = path.join(__dirname, 'data');
const EMBED_MODEL = 'text-embedding-ada-002';

// Load chunks
const chunks = JSON.parse(fs.readFileSync(EMBEDDINGS_FILE, 'utf8'));

/**
 * 🔍 Load all .txt podcast notes from folder and combine them
 */
function loadPodcastNotes() {
  if (!fs.existsSync(PODCAST_NOTES_DIR)) return '';

  const files = fs.readdirSync(PODCAST_NOTES_DIR).filter(f => f.endsWith('.txt'));

  let combinedNotes = '';

  for (const file of files) {
    const noteContent = fs.readFileSync(path.join(PODCAST_NOTES_DIR, file), 'utf8');
    combinedNotes += `--- ${file} ---\n${noteContent}\n\n`;
  }

  return combinedNotes.trim();
}

/**
 * 🤖 Fake embedding (replace with real embedder if needed)
 */
async function embedText(text) {
  return Array(1536).fill(0).map(() => Math.random());
}

/**
 * 📈 Get top K similar chunks based on cosine similarity
 */
async function getRelevantChunks(query, topK = 3) {
  const queryEmbedding = await embedText(query);

  const scoredChunks = chunks.map(chunkObj => {
    const similarity = cosineSimilarity(queryEmbedding, Array(1536).fill(0).map(() => Math.random()));
    return { ...chunkObj, score: similarity };
  });

  return scoredChunks
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(item => item.chunk);
}

/**
 * 🔁 Send query to local Ollama LLM
 */
async function queryLLM(prompt) {
  try {
    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'mistral',
      prompt: prompt,
      stream: false,
    });

    return response.data.response;
  } catch (err) {
    console.error('❌ LLM error:', err.message);
    return '';
  }
}

/**
 * 🧠 CLI assistant
 */
async function runAssistant() {
  const query = readline.question('💬 What do you want help with?\n> ');
  const numResponses = readline.questionInt('🔁 How many responses would you like?\n> ');

  const podcastNotes = loadPodcastNotes();
  const relevantChunks = await getRelevantChunks(query);
  const context = relevantChunks.join('\n\n');

  const finalPrompt = `
You are an expert cold email strategist. Use the podcast notes and document context below to answer the user’s question.

📚 Podcast Notes:
${podcastNotes || 'No notes found in folder.'}

🧩 Related Document Chunks:
${context}

❓ Question:
${query}
`;

  console.log('\n🤖 Thinking...\n');

  for (let i = 1; i <= numResponses; i++) {
    console.log(`🧠 Response ${i}:\n`);
    const response = await queryLLM(finalPrompt);
    console.log(response);
    console.log('\n' + '-'.repeat(60) + '\n');
  }
}

runAssistant();
