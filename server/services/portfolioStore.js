// File-based watchlist store: a single JSON array, since a portfolio is a
// small ordered list, not something that needs per-company files. Each
// entry is a lightweight snapshot (not the full memo) so the portfolio view
// stays fast even with a large watchlist — reopening a company re-fetches
// (from cache, so instant) via the normal /api/research path.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, '..', 'data-cache');
const PORTFOLIO_FILE = path.join(CACHE_DIR, 'portfolio.json');

function load() {
  try {
    return JSON.parse(fs.readFileSync(PORTFOLIO_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function save(list) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(PORTFOLIO_FILE, JSON.stringify(list), 'utf-8');
}

export function listPortfolio() {
  return load();
}

export function addToPortfolio(snapshot) {
  const list = load();
  const key = snapshot.name.trim().toLowerCase();
  const withoutExisting = list.filter((e) => e.name.trim().toLowerCase() !== key);
  const entry = { ...snapshot, addedAt: Date.now() };
  const updated = [entry, ...withoutExisting];
  save(updated);
  return updated;
}

export function removeFromPortfolio(name) {
  const key = name.trim().toLowerCase();
  const updated = load().filter((e) => e.name.trim().toLowerCase() !== key);
  save(updated);
  return updated;
}
