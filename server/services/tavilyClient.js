// Thin wrapper around Tavily's search API (https://tavily.com) — built for
// grounding LLM agents, so results already come back as extracted page
// content rather than raw HTML. Free tier: 1,000 search credits/month;
// "basic" depth costs 1 credit per call, so we keep depth basic and rely
// on well-targeted queries instead of "advanced" depth to conserve quota.

import { recordUsage } from './quotaTracker.js';

const TAVILY_ENDPOINT = 'https://api.tavily.com/search';

// A real run fires 5-9 queries in one batch. Free-tier search APIs commonly
// rate-limit request BURSTS (requests/second), separate from the monthly
// credit quota we already track — firing everything at once got some
// queries silently 429'd while others succeeded, producing exactly what it
// looked like: some sections populated, others inexplicably empty for
// well-documented companies. Two mitigations: retry individual 429s with
// backoff, and stagger the batch instead of firing it all in one instant.
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 1200;
const BATCH_STAGGER_MS = 350;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getApiKey() {
  return process.env.TAVILY_API_KEY;
}

async function doSearch(apiKey, query, maxResults) {
  return fetch(TAVILY_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: 'basic',
      max_results: maxResults,
      include_answer: true,
    }),
  });
}

/**
 * Runs one Tavily search query, retrying on rate-limit (429) with backoff.
 * Returns { query, label, answer, results: [{ title, url, content, score }] }.
 * `label` is an optional evidence-group tag (e.g. "competitor:OpenAI") that
 * passes through untouched, purely so the orchestrator/prompt can attribute
 * evidence to the right section without re-deriving it from the query text.
 */
export async function tavilySearch(query, { maxResults = 5, label } = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('TAVILY_API_KEY is not configured on the server');
  }

  let lastErr;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await doSearch(apiKey, query, maxResults);

    if (res.ok) {
      recordUsage(1); // "basic" depth = 1 credit, charged on any successful call
      const data = await res.json();
      return {
        query,
        label,
        answer: data.answer ?? null,
        results: (data.results ?? []).map((r) => ({
          title: r.title,
          url: r.url,
          content: r.content,
          score: r.score,
        })),
      };
    }

    const body = await res.text().catch(() => '');
    lastErr = Object.assign(new Error(`Tavily search failed (${res.status}): ${body.slice(0, 300)}`), {
      status: res.status,
    });

    if (res.status === 429 && attempt < MAX_RETRIES) {
      const delay = RETRY_BASE_DELAY_MS * (attempt + 1);
      console.error(`[tavily] rate-limited on "${query}", retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
      await sleep(delay);
      continue;
    }

    throw lastErr;
  }
  throw lastErr;
}

/**
 * Runs several Tavily queries, staggering their start so a batch of 5-9
 * doesn't land on the API in one instant burst, while still running mostly
 * in parallel (this is NOT full serialization — just spreading out request
 * starts by BATCH_STAGGER_MS each). Each entry in `queries` can be a plain
 * string or { query, label, maxResults } to override per-query.
 * Individual query failures (even after retries) are swallowed (logged)
 * rather than aborting the whole research run — partial evidence is still
 * useful.
 */
export async function tavilySearchMany(queries, opts) {
  const normalized = queries.map((q) => (typeof q === 'string' ? { query: q } : q));

  const settled = await Promise.allSettled(
    normalized.map(async (q, i) => {
      if (i > 0) await sleep(i * BATCH_STAGGER_MS);
      return tavilySearch(q.query, { maxResults: q.maxResults ?? opts?.maxResults, label: q.label });
    })
  );

  return settled.map((result, i) => {
    if (result.status === 'fulfilled') return result.value;
    console.error(`Tavily query failed: "${normalized[i].query}"`, result.reason?.message);
    return { query: normalized[i].query, label: normalized[i].label, answer: null, results: [], error: true };
  });
}

export function hasTavilyKeyConfigured() {
  return Boolean(getApiKey());
}

export { getUsage as getTavilyUsage } from './quotaTracker.js';
