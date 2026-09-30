# Mural Web

Mural rebuilt as a static web app and a single Cloudflare Worker.

## Architecture

- **Static site** — plain HTML/CSS/JS, no framework, no bundler. `npm run build`
  assembles the minimal browser bundle into `public/`.
- **Worker** (`workers-site/index.js`) — serves the static assets from the
  Workers Static Assets binding and proxies `POST /api/chat` to OpenRouter.

The model API key is a **Cloudflare secret**, never a browser field. The client
only ever talks to this app's own `/api/chat`.

## Commands

```sh
npm run build        # assemble public/
npm test             # Worker request/response contract tests
npm run deploy       # build + wrangler deploy
npm run dev:worker   # local Worker on http://127.0.0.1:8788
npm run dev          # static preview on http://localhost:3000
```

## First-time setup

```sh
wrangler secret put OPENROUTER_API_KEY   # paste your openrouter.ai key
npm run deploy
```

Without the secret, `/api/chat` returns a clear 500 explaining what to set; the
app then falls back to offline practice replies.

## Offline practice mode

Settings offers a mode switch:

- **Live model** — proxied to OpenRouter through the Worker.
- **Offline practice** — canned per-language replies, no network calls.

Useful on a plane, and for testing the UI without spending tokens.

## What is real vs. stubbed

Real:

- Conversation, translation, and assessment all call the live model.
- Adaptive difficulty (`ConversationPace`) and spaced-repetition vocabulary
  (`LearningEngine`) are the ports of the original Swift logic and run on real
  model output.
- Onboarding, session timer, PWA install, import/export.

Stubbed:

- Web Speech recognition depends on browser support (Chrome/Safari yes,
  Firefox no). Falls back to typing.
- Assessment asks for JSON and tolerates parse failure by falling back.

## Tests

`npm test` runs `scripts/test-worker.mjs`, which stubs the upstream provider and
asserts the Worker's contract: method guards, body validation, secret handling,
header forwarding, and — the regression that caused Cloudflare error 1101 — that
a request with no `ASSETS` binding returns a response instead of throwing.
