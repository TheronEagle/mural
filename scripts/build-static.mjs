// scripts/build-static.mjs
// Assembles the minimal static site into public/ for Cloudflare Workers Static Assets.
// Only the files the browser actually needs are copied — the rest of the repo
// (apps/, marketing/, release/, verification/, node_modules/) is never uploaded.

import { mkdir, copyFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'public');

const FILES = [
  'index.html',
  'styles.css',
  'manifest.json',
  'sw.js'
];

const DIRS = ['src'];

async function main() {
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });

  for (const file of FILES) {
    const src = path.join(root, file);
    if (!existsSync(src)) {
      throw new Error(`Missing required static file: ${file}`);
    }
    await copyFile(src, path.join(out, file));
  }

  for (const dir of DIRS) {
    await copyDir(path.join(root, dir), path.join(out, dir));
  }

  // Static asset serving: let the Worker handle /api/*, everything else from assets.
  await writeFile(
    path.join(out, '_routes.json'),
    JSON.stringify([{ path: '/api/*', handler: 'worker' }], null, 2) + '\n'
  );

  console.log('Static build complete -> public/');
}

async function copyDir(src, dest) {
  const { cp } = await import('node:fs/promises');
  await cp(src, dest, { recursive: true });
}

main().catch((err) => {
  console.error('Static build failed:', err.message);
  process.exit(1);
});
