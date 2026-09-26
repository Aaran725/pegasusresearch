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

// Standard and Deep results for the same company are different data
// products (materially different completeness/breadth) — the cache key
// includes depth so switching modes never silently serves the other mode's
// result.
function keyToPath(company, depth) {
  const safe = company.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return path.join(CACHE_DIR, `${safe || 'unknown'}--${depth}.json`);
}

export function getCached(company, depth) {
  try {
    const raw = fs.readFileSync(keyToPath(company, depth), 'utf-8');
    const entry = JSON.parse(raw);
    const ageMs = Date.now() - entry.fetchedAt;
    return { ...entry, stale: ageMs > STALE_AFTER_MS };
  } catch {
    return null;
  }
}

export function setCached(company, depth, { memo, researchTrace }) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const entry = { memo, researchTrace, fetchedAt: Date.now() };
  fs.writeFileSync(keyToPath(company, depth), JSON.stringify(entry), 'utf-8');
  return entry;
}

/**
 * Reads every cached research entry. Used by the trends view to compute
 * real aggregates over what's actually been researched — never fabricated
 * "market data", since we have no external market-data source.
 */
export function listAllCached() {
  let files;
  try {
    files = fs.readdirSync(CACHE_DIR).filter((f) => f.endsWith('.json'));
  } catch {
    return [];
  }
  const entries = [];
  for (const file of files) {
    try {
      const entry = JSON.parse(fs.readFileSync(path.join(CACHE_DIR, file), 'utf-8'));
      entries.push(entry);
    } catch {
      continue; // skip corrupt/partial files rather than failing the whole list
    }
  }
  return entries;
}
