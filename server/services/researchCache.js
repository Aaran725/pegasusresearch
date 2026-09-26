// File-based cache for completed research runs, keyed by normalized company
// name. Keeps re-searching the same company from silently re-burning Tavily
// quota, and gives the UI a real "last researched X ago" + manual refresh
// instead of hitting the live pipeline on every single search.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, '..', 'data-cache', 'research');

// Entries older than this are still served (better than a hard failure or
// a silent full re-run) but flagged `stale: true` so the UI can offer a
// manual refresh instead of pretending the data is fresh.
export const STALE_AFTER_MS = 24 * 60 * 60 * 1000; // 24h

function keyToPath(company) {
  const safe = company.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return path.join(CACHE_DIR, `${safe || 'unknown'}.json`);
}

export function getCached(company) {
  try {
    const raw = fs.readFileSync(keyToPath(company), 'utf-8');
    const entry = JSON.parse(raw);
    const ageMs = Date.now() - entry.fetchedAt;
    return { ...entry, stale: ageMs > STALE_AFTER_MS };
  } catch {
    return null;
  }
}

export function setCached(company, { memo, researchTrace }) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const entry = { memo, researchTrace, fetchedAt: Date.now() };
  fs.writeFileSync(keyToPath(company), JSON.stringify(entry), 'utf-8');
  return entry;
}
