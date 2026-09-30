export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Forward API calls to the chat handler
    if (url.pathname.startsWith('/api/chat') && request.method === 'POST') {
      // Import chat handler dynamically
      const chatHandler = await import('../src/api/chat.js');
      return chatHandler.default.fetch(request, env);
    }

    // Serve static assets from Pages bucket
    // env.ASSETS is available in Pages functions
    return env.ASSETS.fetch(request);
  }
};