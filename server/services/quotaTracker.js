// Tracks Tavily search-credit usage against the free-tier monthly limit,
// persisted to a small JSON file so it survives server restarts. This is
// deliberately simple (file, not a DB) — the goal is to stop the app from
// silently degrading mid-month when the free quota runs out, not to build
// a billing system.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, '..', 'data-cache');
const QUOTA_FILE = path.join(CACHE_DIR, 'quota.json');

export const TAVILY_MONTHLY_LIMIT = 1000;

function currentMonthKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function load() {
  try {
    const raw = fs.readFileSync(QUOTA_FILE, 'utf-8');
    const data = JSON.parse(raw);
    if (data.month === currentMonthKey()) return data;
  } catch {
    // no file yet, or corrupt — start fresh
  }
  return { month: currentMonthKey(), used: 0 };
}

function save(data) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(QUOTA_FILE, JSON.stringify(data), 'utf-8');
}

/** Records `n` Tavily search credits as spent this month. */
export function recordUsage(n = 1) {
  const data = load();
  data.used += n;
  save(data);
  return data.used;
}

/** Returns { used, limit, remaining } for the current calendar month. */
export function getUsage() {
  const data = load();
  return {
    used: data.used,
    limit: TAVILY_MONTHLY_LIMIT,
    remaining: Math.max(0, TAVILY_MONTHLY_LIMIT - data.used),
  };
}
