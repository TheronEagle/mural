#!/usr/bin/env node
// Guards the committed public/ directory against drift.
//
// CI runs `npx wrangler deploy` with no build step, so public/ is checked into
// git. If someone edits index.html, styles.css or anything under src/ and
// forgets `npm run build`, the deployed site would silently ship stale code.
// This test rebuilds into a scratch directory and diffs it against what's
// committed.

import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { build, listFiles, ROOT } from './build-static.mjs';

const committed = path.join(ROOT, 'public');

if (!existsSync(committed)) {
  console.error('public/ is missing from the repo. Run: npm run build');
  process.exit(1);
}

const scratch = await mkdtemp(path.join(os.tmpdir(), 'mural-verify-'));

try {
  await build(scratch);

  const builtFiles = await listFiles(scratch);
  const committedFiles = await listFiles(committed);

  const missing = builtFiles.filter((f) => !committedFiles.includes(f));
  const stale = committedFiles.filter((f) => !builtFiles.includes(f));

  const changed = [];
  for (const f of builtFiles) {
    if (!committedFiles.includes(f)) continue;
    const a = await readFile(path.join(scratch, f));
    const b = await readFile(path.join(committed, f));
    if (!a.equals(b)) changed.push(f);
  }

  const problems = [
    ...missing.map((f) => `missing from public/  ${f}`),
    ...stale.map((f) => `stale in public/      ${f}`),
    ...changed.map((f) => `out of date in public/ ${f}`)
  ];

  if (problems.length) {
    console.error('public/ is out of sync with the source files:\n  ' + problems.join('\n  '));
    console.error('\nFix with: npm run build   (then commit public/)');
    process.exit(1);
  }

  console.log(`public/ is in sync with source (${committedFiles.length} files)`);
} finally {
  await rm(scratch, { recursive: true, force: true });
}
