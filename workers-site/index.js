// Workers site entry point for Mural Web
// Serves static files for the SPA, forwards /api/chat to the API handler

import chatHandler from '../src/api/chat.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Forward API calls to the chat handler
    if (url.pathname.startsWith('/api/chat') && request.method === 'POST') {
      return chatHandler.fetch(request, env);
    }

    // Serve static HTML for SPA routing
    if (url.pathname === '/' || url.pathname === '/index.html' || url.pathname === '') {
      url.pathname = '/index.html';
    }

    // Try to serve the file from the bucket
    try {
      const content = await env.ASSETS.fetch(request);
      return content;
    } catch (e) {
      // Fallback: serve index.html for any unmatched routes (SPA routing)
      if (request.method === 'GET') {
        return new Response(
          `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Mural - Learn Chinese</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div id="root">Initializing...</div>
  <script type="module" src="/src/app.js"></script>
</body>
</html>`,
          {
            headers: {
              'Content-Type': 'text/html',
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
          }
        );
      }
    }
  }
};