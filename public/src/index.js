// This would be the actual worker entry point
// For now, our API routes are in src/api/chat.js
// In a real deployment, wrangler would route to this

import chatHandler from './src/api/chat.js';

export default {
  fetch: chatHandler.fetch
};