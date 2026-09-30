// Assembles the minimal static site for Cloudflare Workers Static Assets.
// Only the files the browser actually loads are copied — the rest of the repo
// (apps/, marketing/, release/, verification/, node_modules/) is never uploaded.
//
// `public/` is committed because CI runs `npx wrangler deploy` with no build
// step. Run `npm run build` after changing any static source file.

import { mkdir, copyFile, rm, cp, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const FILES = ['index.html', 'styles.css', 'manifest.json', 'sw.js'];
const DIRS = ['src'];

export async function build(outDir) {
  const out = outDir || path.join(ROOT, 'public');

  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });

  for (const file of FILES) {
    const src = path.join(ROOT, file);
    if (!existsSync(src)) throw new Error(`Missing required static file: ${file}`);
    await copyFile(src, path.join(out, file));
  }

  for (const dir of DIRS) {
    await cp(path.join(ROOT, dir), path.join(out, dir), { recursive: true });
  }

  return out;
}

export async function listFiles(dir, base = dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await listFiles(full, base)));
    else out.push(path.relative(base, full));
  }
  return out.sort();
}

// Run directly (not imported): build public/
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = await build();
  const files = await listFiles(out);
  console.log(`Static build complete -> ${path.relative(ROOT, out)}/ (${files.length} files)`);
}
