import { generateColdEmails } from '../../../../inreach-ai/systemPrompt';

export async function POST(req) {
  try {
    const { businessContext, numCopies } = await req.json();
    const apiKey = process.env.HUGGINGFACE_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'HuggingFace API key is not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { emails, subjects } = await generateColdEmails(businessContext, numCopies, apiKey);

    return new Response(
      JSON.stringify({ emails, subjects }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate API route:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 