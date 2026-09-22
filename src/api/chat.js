// src/api/chat.js
// Cloudflare Workers handler for /api/chat
// Proxies to OpenRouter (or other provider) with the same interface as the original APIClient

import { OPENROUTER_API_KEY } from './config.js'; // we'll create this

// Default model if none specified
const DEFAULT_MODEL = 'meta-llama/llama-3.3-70b-instruct:free';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/chat') && request.method === 'POST') {
      return handleChat(request, env);
    }
    // Serve static assets for other routes
    return await env.ASSETS.fetch(request);
  }
};

async function handleChat(request, env) {
  try {
    const { instructions, input, search = false, schema = null } = await request.json();

    // Build the payload for OpenRouter (OpenAI-compatible)
    const messages = [];
    if (instructions) {
      messages.push({ role: 'system', content: instructions });
    }
    messages.push({ role: 'user', content: input });

    const payload = {
      model: DEFAULT_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: schema ? 2200 : 1400, // similar to original
      stream: false
    };

    // Add tools if search is requested
    if (search) {
      payload.tools = [{ type: 'web_search' }];
      payload.tool_choice = 'auto';
    }

    // Add structured output schema if provided (for assessment)
    if (schema) {
      payload.response_format = {
        type: 'json_schema',
        json_schema: {
          name: 'mural_result',
          schema: schema,
          strict: true
        }
      };
    }

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://mural-web.pages.dev', // optional
        'X-Title': 'Mural Web'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter error: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    // Extract the response text (similar to original APIClient)
    let text = '';
    if (data.choices && data.choices[0]) {
      text = data.choices[0].message.content || '';
    }

    // If we used structured output, the content might be a JSON string
    if (schema && text) {
      try {
        // Try to parse as JSON to validate
        JSON.parse(text);
        // If valid, return as is (the caller will parse it)
        return new Response(JSON.stringify({ text }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (e) {
        // If not valid JSON, wrap it in a text response (fallback)
        return new Response(JSON.stringify({ text }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Return just the text (the caller expects a string)
    return new Response(JSON.stringify({ text }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('API chat error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Helper to create error responses matching original APIError
function apiError(message) {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' }
  });
}
