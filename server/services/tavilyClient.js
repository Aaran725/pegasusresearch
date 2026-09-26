// Thin wrapper around Tavily's search API (https://tavily.com) — built for
// grounding LLM agents, so results already come back as extracted page
// content rather than raw HTML. Free tier: 1,000 search credits/month;
// "basic" depth costs 1 credit per call, so we keep depth basic and rely
// on well-targeted queries instead of "advanced" depth to conserve quota.

import { recordUsage } from './quotaTracker.js';

const TAVILY_ENDPOINT = 'https://api.tavily.com/search';

function getApiKey() {
  return process.env.TAVILY_API_KEY;
}

/**
 * Runs one Tavily search query.
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

  const res = await fetch(TAVILY_ENDPOINT, {
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

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const err = new Error(`Tavily search failed (${res.status}): ${body.slice(0, 300)}`);
    err.status = res.status;
    throw err;
  }

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

/**
 * Runs several Tavily queries in parallel. Each entry in `queries` can be a
 * plain string or { query, label, maxResults } to override per-query.
 * Individual query failures are swallowed (logged) rather than aborting the
 * whole research run — partial evidence is still useful.
 */
export async function tavilySearchMany(queries, opts) {
  const normalized = queries.map((q) => (typeof q === 'string' ? { query: q } : q));
  const settled = await Promise.allSettled(
    normalized.map((q) => tavilySearch(q.query, { maxResults: q.maxResults ?? opts?.maxResults, label: q.label }))
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
