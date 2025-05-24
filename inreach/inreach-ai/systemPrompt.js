const fs = require('fs');
const path = require('path');
const axios = require('axios');
const readline = require('readline-sync');
const cosineSimilarity = require('cosine-similarity');

const EMBEDDINGS_FILE = path.join(__dirname, 'data', 'chunks.json');
const PODCAST_NOTES_DIR = path.join(__dirname, 'data');
const BATCH_SIZE = 10; // Process chunks in batches to reduce memory usage

// Load chunks in batches
function* loadChunksInBatches() {
  const fileContent = fs.readFileSync(EMBEDDINGS_FILE, 'utf8');
  const chunks = JSON.parse(fileContent);
  
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    yield chunks.slice(i, i + BATCH_SIZE);
  }
}

/**
 * 🔍 Load all .txt podcast notes from folder and combine them
 */
function loadPodcastNotes() {
  if (!fs.existsSync(PODCAST_NOTES_DIR)) return '';

  const files = fs.readdirSync(PODCAST_NOTES_DIR).filter(f => f.endsWith('.txt'));
  return files.map(file => {
    const noteContent = fs.readFileSync(path.join(PODCAST_NOTES_DIR, file), 'utf8');
    return `--- ${file} ---\n${noteContent}`;
  }).join('\n\n').trim();
}

/**
 * 🤖 Get embeddings from local Ollama model
 */
async function embedText(text) {
  try {
    const response = await axios.post('http://localhost:11434/api/embeddings', {
      model: 'nomic-embed-text',
      prompt: text
    });
    return response.data.embedding;
  } catch (err) {
    console.error('❌ Embedding error:', err.message);
    return Array(768).fill(0); // Fallback to zero vector (nomic-embed-text uses 768 dimensions)
  }
}

/**
 * 📈 Get top K similar chunks based on cosine similarity
 */
async function getRelevantChunks(query, topK = 3) {
  const queryEmbedding = await embedText(query);
  let bestChunks = [];
  let bestScores = [];

  // Process chunks in batches
  for (const batch of loadChunksInBatches()) {
    const scoredChunks = batch.map(chunkObj => {
      const similarity = cosineSimilarity(queryEmbedding, chunkObj.embedding);
      return { chunk: chunkObj.chunk, score: similarity };
    });

    // Merge with current best chunks
    bestChunks = [...bestChunks, ...scoredChunks]
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  return bestChunks.map(item => item.chunk);
}

/**
 * 🔁 Send query to local Ollama LLM with retries
 */
async function queryLLM(prompt, maxRetries = 3, timeout = 60000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries}...`);
      const response = await Promise.race([
        axios.post('http://localhost:11434/api/generate', {
          model: 'mistral',
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: 500 // Limit response length to improve speed
          }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('LLM request timed out')), timeout)
        )
      ]);

      return response.data.response;
    } catch (err) {
      console.error(`❌ Attempt ${attempt} failed:`, err.message);
      if (attempt === maxRetries) {
        throw new Error(`Failed after ${maxRetries} attempts: ${err.message}`);
      }
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
}

/**
 * 🧠 CLI assistant
 */
async function runAssistant() {
  const query = readline.question('💬 What do you want help with?\n> ');
  const numResponses = readline.questionInt('🔁 How many responses would you like?\n> ');

  // 🌐 Ask for business-related context
  const businessContext = readline.question(
    '\n📌 Optional: Tell me about your business, audience, tone, product, or anything that might help personalize the response.\n> '
  );

  const podcastNotes = loadPodcastNotes();
  const relevantChunks = await getRelevantChunks(query);
  const context = relevantChunks.join('\n\n');

  const finalPrompt = `
  You are an expert cold email strategist. Use the podcast notes, business context, and relevant chunks below to answer the user's question. Make sure the email is short and to the point, the very first paragraph or few sentences should be the hook that grabs attention. And use no emojis.

  📌 Business Context:
  ${businessContext || 'No additional info provided.'}

  📚 Podcast Notes:
  ${podcastNotes || 'No notes found in folder.'}

  🧩 Related Document Chunks:
  ${context}

  ❓ Question:
  ${query}
  `;

  console.log('\n🤖 Thinking...\n');

  // Process responses sequentially
  for (let i = 1; i <= numResponses; i++) {
    try {
      console.log(`🧠 Generating Response ${i}...`);
      const response = await queryLLM(finalPrompt);
      console.log(`Response ${i}:\n${response}\n${'-'.repeat(60)}\n`);
    } catch (err) {
      console.error(`Failed to generate response ${i}:`, err.message);
      console.log(`Skipping response ${i}...\n${'-'.repeat(60)}\n`);
    }
  }
}

runAssistant();
