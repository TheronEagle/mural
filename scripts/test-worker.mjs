// scripts/test-worker.mjs
// Exercises the Worker against a stubbed OpenRouter so the request/response
// contract is verified without spending tokens or needing a real API key.

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mod = await import(path.join(root, 'workers-site/index.js'));
const worker = mod.default;

const originalFetch = globalThis.fetch;
let lastUpstream = null;

function env(overrides = {}) {
  return {
    OPENROUTER_API_KEY: 'test-key',
    AI_MODEL: 'meta-llama/llama-3.3-70b-instruct:free',
    ...overrides
  };
}

function req(pathname, options = {}) {
  return new Request(`https://mural.test${pathname}`, options);
}

function postChat(body) {
  return req('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

const tests = [];
function test(name, fn) { tests.push([name, fn]); }

test('returns 405 for GET /api/chat', async () => {
  const res = await worker.fetch(req('/api/chat'), env());
  assert.equal(res.status, 405);
});

test('returns 400 for malformed JSON', async () => {
  const res = await worker.fetch(
    req('/api/chat', { method: 'POST', body: 'not json' }),
    env()
  );
  assert.equal(res.status, 400);
});

test('returns 400 when no instructions or input', async () => {
  const res = await worker.fetch(postChat({}), env());
  assert.equal(res.status, 400);
});

test('reports a clear error when the secret is missing', async () => {
  const res = await worker.fetch(postChat({ instructions: 'hi' }), env({ OPENROUTER_API_KEY: '' }));
  assert.equal(res.status, 500);
  const body = await res.json();
  assert.match(body.error, /wrangler secret put/);
});

test('proxies to OpenRouter and returns text', async () => {
  globalThis.fetch = async (url, init) => {
    lastUpstream = { url, init };
    return new Response(JSON.stringify({
      choices: [{ message: { content: '你好！今天怎么样？' } }]
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  const res = await worker.fetch(
    postChat({ instructions: 'You are a Mandarin teacher.', input: 'hi' }),
    env()
  );

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.text, '你好！今天怎么样？');

  assert.equal(lastUpstream.url, 'https://openrouter.ai/api/v1/chat/completions');
  assert.equal(lastUpstream.init.headers.Authorization, 'Bearer test-key');

  const sent = JSON.parse(lastUpstream.init.body);
  assert.deepEqual(sent.messages, [
    { role: 'system', content: 'You are a Mandarin teacher.' },
    { role: 'user', content: 'hi' }
  ]);
  assert.equal(sent.stream, false);
});

test('surfaces provider errors instead of throwing', async () => {
  globalThis.fetch = async () => new Response('rate limited', { status: 429 });

  const res = await worker.fetch(postChat({ instructions: 'hi' }), env());
  assert.equal(res.status, 502);
  const body = await res.json();
  assert.match(body.error, /Provider error 429/);
});

test('returns 404 for unknown /api routes', async () => {
  const res = await worker.fetch(req('/api/nope'), env());
  assert.equal(res.status, 404);
});

test('never throws when there is no ASSETS binding', async () => {
  const res = await worker.fetch(req('/'), env());
  assert.equal(res.status, 200);
  assert.equal(await res.text(), 'Mural Web');
});

let passed = 0;
for (const [name, fn] of tests) {
  try {
    await fn();
    passed++;
    console.log(`  ok  ${name}`);
  } catch (err) {
    console.error(`FAIL  ${name}\n      ${err.message}`);
    process.exitCode = 1;
  }
}

globalThis.fetch = originalFetch;
console.log(`\n${passed}/${tests.length} passed`);
