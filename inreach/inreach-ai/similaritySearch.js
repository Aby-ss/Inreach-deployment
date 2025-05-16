const fs = require('fs');
const path = require('path');
const axios = require('axios');
const readline = require('readline-sync');

const cosineSimilarity = (a, b) => {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dot / (magA * magB);
};

const CHUNKS_FILE = path.join(__dirname, 'data', 'chunks.json');
const NOTES_DIR = path.join(__dirname, 'data');

/**
 * 🧠 Embed query using Ollama
 */
async function embedText(text) {
  const res = await axios.post('http://localhost:11434/api/embeddings', {
    model: 'nomic-embed-text',
    prompt: text,
  });

  return res.data.embedding;
}

/**
 * 🧩 Get relevant chunks via cosine similarity
 */
async function getRelevantChunks(query, topK = 3) {
  const queryEmbedding = await embedText(query);
  const data = JSON.parse(fs.readFileSync(CHUNKS_FILE, 'utf8'));

  const scored = data.map(item => ({
    chunk: item.chunk,
    score: cosineSimilarity(queryEmbedding, item.embedding),
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(item => item.chunk);
}

/**
 * 📚 Load podcast notes from .txt files
 */
function loadPodcastNotes() {
  if (!fs.existsSync(NOTES_DIR)) return '';

  const files = fs.readdirSync(NOTES_DIR).filter(f => f.endsWith('.txt'));
  let combined = '';

  for (const file of files) {
    const content = fs.readFileSync(path.join(NOTES_DIR, file), 'utf8');
    combined += `--- ${file} ---\n${content}\n\n`;
  }

  return combined.trim();
}

/**
 * 🤖 Query the LLM (e.g., mistral)
 */
async function queryLLM(prompt) {
  try {
    const res = await axios.post('http://localhost:11434/api/generate', {
      model: 'mistral',
      prompt,
      stream: false,
    });

    return res.data.response;
  } catch (err) {
    console.error('❌ LLM error:', err.message);
    return '';
  }
}

/**
 * ✅ Check for cold email factors in the response
 */
function evaluateResponseFactors(response) {
  const checks = {
    intent: /intent|goal|objective|reason/i.test(response),
    personalization: /you|your team|congrats|noticed|saw|read/i.test(response),
    value: /benefit|value|help you|growth|increase|reduce|results/i.test(response),
    cta: /schedule|call|chat|book|reply|interested|connect/i.test(response),
    prospectCentric: /you|your|team|business|company/i.test(response) && !/we|our|my company/i.test(response)
  };

  console.log('📋 Quality Factor Checklist:\n');
  console.log(`🎯 Intent Present: ${checks.intent ? '✅' : '❌'}`);
  console.log(`📌 Personalized: ${checks.personalization ? '✅' : '❌'}`);
  console.log(`💥 Value-Centric: ${checks.value ? '✅' : '❌'}`);
  console.log(`🚀 Has CTA: ${checks.cta ? '✅' : '❌'}`);
  console.log(`🔍 Prospect-Focused: ${checks.prospectCentric ? '✅' : '❌'}`);
  console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * 🧠 Main assistant
 */
async function runAssistant() {
  const query = readline.question('💬 What do you want help with?\n> ');
  const responses = readline.questionInt('🔁 How many responses would you like?\n> ');

  const podcastNotes = loadPodcastNotes();
  const relevantChunks = await getRelevantChunks(query);
  const context = relevantChunks.join('\n\n');

  const finalPrompt = `
You are an expert cold email strategist. Use the podcast notes and chunks below to answer the user’s question.

📚 Podcast Notes:
${podcastNotes || 'No notes found.'}

🧩 Chunks:
${context}

❓ Question:
${query}
`;

  console.log('\n🤖 Thinking...\n');

  for (let i = 1; i <= responses; i++) {
    console.log(`🧠 Response ${i}:\n`);
    const output = await queryLLM(finalPrompt);
    console.log(output);

    // 🧾 Evaluate cold email quality factors
    evaluateResponseFactors(output);

    console.log('-'.repeat(60) + '\n');
  }
}

runAssistant();
