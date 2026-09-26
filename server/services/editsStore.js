// File-based store for analyst edits/overrides on top of a researched
// memo — the human-in-the-loop layer. Edits are a flat map of top-level
// memo field -> overridden value, keyed by normalized company name and
// persisted alongside the research cache. This is deliberately NOT baked
// into researchCache.js: a refresh should re-run research without wiping
// out an analyst's own corrections, so the two are merged at read time
// instead of edits being stored inside the cached memo itself.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EDITS_DIR = path.join(__dirname, '..', 'data-cache', 'edits');

// Only these fields are editable — deliberately narrow. Arrays (comps,
// competitors, etc.) aren't covered yet; see Dashboard/AIVerdict for what
// the UI currently exposes.
export const EDITABLE_FIELDS = new Set(['aiVerdict', 'valuation', 'totalRaised', 'leadInvestors', 'tam']);

function keyToPath(company) {
  const safe = company.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return path.join(EDITS_DIR, `${safe || 'unknown'}.json`);
}

export function getEdits(company) {
  try {
    return JSON.parse(fs.readFileSync(keyToPath(company), 'utf-8'));
  } catch {
    return {};
  }
}

export function saveEdits(company, incoming) {
  const filtered = Object.fromEntries(
    Object.entries(incoming ?? {}).filter(([key, value]) => EDITABLE_FIELDS.has(key) && typeof value === 'string')
  );
  const existing = getEdits(company);
  const merged = { ...existing, ...filtered };
  fs.mkdirSync(EDITS_DIR, { recursive: true });
  fs.writeFileSync(keyToPath(company), JSON.stringify(merged), 'utf-8');
  return merged;
}

/** Applies stored edits on top of a memo, returning { memo, editedFields }. */
export function applyEdits(company, memo) {
  const edits = getEdits(company);
  const editedFields = Object.keys(edits);
  if (editedFields.length === 0) return { memo, editedFields: [] };
  return { memo: { ...memo, ...edits }, editedFields };
}
