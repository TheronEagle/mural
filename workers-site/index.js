// Mural Web - Pages Functions entry point
// Handles /api/chat and serves static assets

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle API chat requests
    if (url.pathname.startsWith('/api/chat') && request.method === 'POST') {
      try {
        const { instructions, input, search = false, schema = null } = await request.json();

        const messages = [];
        if (instructions) {
          messages.push({ role: 'system', content: instructions });
        }
        messages.push({ role: 'user', content: input || '' });

        const payload = {
          model: env.AI_MODEL || 'meta-llama/llama-3.3-70b-instruct:free',
          messages,
          temperature: 0.7,
          max_tokens: schema ? 2200 : 1400,
          stream: false
        };

        if (search) {
          payload.tools = [{ type: 'web_search' }];
          payload.tool_choice = 'auto';
        }

        if (schema) {
          payload.response_format = {
            type: 'json_schema',
            json_schema: { name: 'mural_result', schema: schema, strict: true }
          };
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.OPENROUTER_API_KEY || ''}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://mural.theroneagle.workers.dev',
            'X-Title': 'Mural Web'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          return new Response(JSON.stringify({ error: `OpenRouter error: ${response.status} ${errorText}` }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';

        return new Response(JSON.stringify({ text }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Serve static assets from Pages bucket
    return env.ASSETS.fetch(request);
  }
};