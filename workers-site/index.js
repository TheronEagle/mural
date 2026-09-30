// Mural Web — Cloudflare Worker
// Serves the static site from the Workers Static Assets binding and handles
// POST /api/chat by proxying to OpenRouter.
//
// The API key is read from the OPENROUTER_API_KEY secret. It is never exposed
// to the browser — the client only ever talks to this endpoint.

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'meta-llama/llama-3.3-70b-instruct:free';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

async function handleChat(request, env) {
  let payloadIn;
  try {
    payloadIn = await request.json();
  } catch {
    return json({ error: 'Request body must be valid JSON.' }, 400);
  }

  const { instructions = '', input = '', search = false, schema = null } = payloadIn || {};

  if (!instructions && !input) {
    return json({ error: 'Provide `instructions`, `input`, or both.' }, 400);
  }

  if (!env.OPENROUTER_API_KEY) {
    return json({
      error: 'OPENROUTER_API_KEY is not set on this Worker. Set it with: wrangler secret put OPENROUTER_API_KEY'
    }, 500);
  }

  const messages = [];
  if (instructions) messages.push({ role: 'system', content: instructions });
  if (input) messages.push({ role: 'user', content: input });

  const body = {
    model: env.AI_MODEL || DEFAULT_MODEL,
    messages,
    temperature: 0.7,
    max_tokens: schema ? 2200 : 1400,
    stream: false
  };

  if (search) {
    body.tools = [{ type: 'web_search' }];
    body.tool_choice = 'auto';
  }

  if (schema) {
    body.response_format = {
      type: 'json_schema',
      json_schema: { name: 'mural_result', schema, strict: true }
    };
  }

  let upstream;
  try {
    upstream = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://mural.theroneagle.workers.dev',
        'X-Title': 'Mural Web'
      },
      body: JSON.stringify(body)
    });
  } catch (err) {
    return json({ error: `Could not reach the model provider: ${err.message}` }, 502);
  }

  if (!upstream.ok) {
    const detail = await upstream.text();
    return json({ error: `Provider error ${upstream.status}: ${detail.slice(0, 500)}` }, 502);
  }

  const data = await upstream.json();
  const text = data?.choices?.[0]?.message?.content ?? '';

  return json({ text });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/chat') {
      if (request.method !== 'POST') {
        return json({ error: 'Use POST for /api/chat.' }, 405);
      }
      return handleChat(request, env);
    }

    if (url.pathname.startsWith('/api/')) {
      return json({ error: 'Not found' }, 404);
    }

    // Static assets. With Workers Static Assets, non-matching requests fall
    // through to the asset store automatically — env.ASSETS is only needed if
    // we want explicit control, so guard it.
    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }

    return new Response('Mural Web', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
};
