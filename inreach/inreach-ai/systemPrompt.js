const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cosineSimilarity = require('cosine-similarity');

const EMBEDDINGS_FILE = path.join(__dirname, 'data', 'chunks.json');
const PODCAST_NOTES_DIR = path.join(__dirname, 'data');
const BATCH_SIZE = 10; // Process chunks in batches to reduce memory usage

// Load chunks in batches
function* loadChunksInBatches() {
  try {
    const fileContent = fs.readFileSync(EMBEDDINGS_FILE, 'utf8');
    const chunks = JSON.parse(fileContent);
    
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      yield chunks.slice(i, i + BATCH_SIZE);
    }
  } catch (error) {
    console.error('Error loading chunks:', error);
    yield []; // Return empty array if there's an error
  }
}

/**
 * 🔍 Load all .txt podcast notes from folder and combine them
 */
function loadPodcastNotes() {
  try {
    const files = fs.readdirSync(PODCAST_NOTES_DIR).filter(f => f.endsWith('.txt'));
    if (files.length === 0) return '';

    return files.map(file => {
      const noteContent = fs.readFileSync(path.join(PODCAST_NOTES_DIR, file), 'utf8');
      return `--- ${file} ---\n${noteContent}`;
    }).join('\n\n').trim();
  } catch (error) {
    console.error('Error loading podcast notes:', error);
    return '';
  }
}

/**
 * 🤖 Get embeddings from HuggingFace API
 */
async function embedText(text, apiKey) {
  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2',
      { 
        inputs: {
          source_sentence: text,
          sentences: [text] // The model expects both source_sentence and sentences
        },
        options: {
          wait_for_model: true
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Invalid response format from HuggingFace API');
    }

    // The model returns similarity scores, we'll use the first one as our embedding
    return response.data[0];
  } catch (err) {
    console.error('❌ Embedding error:', err.message);
    if (err.response) {
      console.error('Response data:', err.response.data);
      console.error('Response status:', err.response.status);
    }
    return Array(384).fill(0); // Fallback to zero vector (all-MiniLM-L6-v2 uses 384 dimensions)
  }
}

/**
 * 📈 Get top K similar chunks based on cosine similarity
 */
async function getRelevantChunks(query, apiKey, topK = 3) {
  try {
    const queryEmbedding = await embedText(query, apiKey);
    let bestChunks = [];
    let bestScores = [];

    // Process chunks in batches
    for (const batch of loadChunksInBatches()) {
      if (batch.length === 0) continue;
      
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
  } catch (error) {
    console.error('Error getting relevant chunks:', error);
    return [];
  }
}

/**
 * 📧 Generate personalized cold emails using HuggingFace API
 */
async function generateColdEmails(businessContext, numCopies = 1, apiKey) {
  const API_URL = 'https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta';
  
  if (!apiKey) {
    throw new Error('HuggingFace API key is required');
  }

  try {
    const podcastNotes = loadPodcastNotes();
    const relevantChunks = await getRelevantChunks(businessContext, apiKey);
    const context = relevantChunks.join('\n\n');

    // Extract personal information from business context
    const nameMatch = businessContext.match(/(?:my name is|i am|i'm) ([^,.]+)/i);
    const companyMatch = businessContext.match(/(?:my company|my business|i run|i own) (?:is|are|called)? ([^,.]+)/i);
    const roleMatch = businessContext.match(/(?:i am|i'm) (?:a|an) ([^,.]+)/i);
    const industryMatch = businessContext.match(/(?:in|within|for) (?:the)? ([^,.]+) (?:industry|sector|market)/i);

    const personalInfo = {
      name: nameMatch ? nameMatch[1].trim() : null,
      company: companyMatch ? companyMatch[1].trim() : null,
      role: roleMatch ? roleMatch[1].trim() : null,
      industry: industryMatch ? industryMatch[1].trim() : null
    };

    const finalPrompt = `
    You are an expert cold email strategist. Use the podcast notes, business context, and relevant chunks below to answer the user's question. Make sure the email is short and to the point, the very first paragraph or few sentences should be the hook that grabs attention. And use no emojis.

    📌 Business Context:
    ${businessContext || 'No additional info provided.'}

    👤 Personal Information:
    ${Object.entries(personalInfo)
      .filter(([_, value]) => value)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n')}

    📚 Podcast Notes:
    ${podcastNotes || 'No notes found in folder.'}

    🧩 Related Document Chunks:
    ${context}

    ❓ Question:
    Generate a cold email that:
    1. Has a strong hook in the first few sentences
    2. Is personalized to the recipient
    3. Is concise and to the point
    4. Has a clear call to action
    5. Incorporates the personal information provided above naturally
    6. Uses the business context to make the email more relevant

    Format your response exactly like this:
    SUBJECT: [Your subject line here]
    BODY: [Your email body here]

    Do not include any other text or formatting in your response.
    `;

    const emails = [];
    const subjects = [];

    for (let i = 0; i < numCopies; i++) {
      try {
        const response = await axios.post(
          API_URL,
          {
            inputs: finalPrompt,
            parameters: {
              temperature: 0.7,
              max_new_tokens: 500,
              return_full_text: false,
              do_sample: true
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.data || !response.data[0] || !response.data[0].generated_text) {
          throw new Error('Invalid response format from HuggingFace API');
        }

        const responseText = response.data[0].generated_text;
        
        // Parse subject and body with regex
        const subjectMatch = responseText.match(/SUBJECT:\s*([^\n]+)/i);
        const bodyMatch = responseText.match(/BODY:\s*([\s\S]*?)(?:\n\s*$|$)/i);
        
        // Extract and clean the subject and body
        const subject = subjectMatch ? subjectMatch[1].trim() : 'No subject';
        let body = bodyMatch ? bodyMatch[1].trim() : responseText.trim();
        
        // Remove any remaining subject line markers from the body
        body = body.replace(/^SUBJECT:.*$/im, '').trim();
        
        // Remove any emojis from the subject
        const cleanSubject = subject.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
        
        emails.push(body);
        subjects.push(cleanSubject);
      } catch (error) {
        console.error(`Error generating email ${i + 1}:`, error);
        throw new Error(`Failed to generate email: ${error.message}`);
      }
    }

    return { emails, subjects };
  } catch (error) {
    console.error('Error in generateColdEmails:', error);
    throw error;
  }
}

module.exports = {
  generateColdEmails
};
