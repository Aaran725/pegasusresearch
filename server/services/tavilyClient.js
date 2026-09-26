// Thin wrapper around Tavily's search API (https://tavily.com) — built for
// grounding LLM agents, so results already come back as extracted page
// content rather than raw HTML. Free tier: 1,000 search credits/month;
// "basic" depth costs 1 credit per call, so we keep depth basic and rely
// on well-targeted queries instead of "advanced" depth to conserve quota.

const TAVILY_ENDPOINT = 'https://api.tavily.com/search';

function getApiKey() {
  return process.env.TAVILY_API_KEY;
}

/**
 * Runs one Tavily search query.
 * Returns { query, answer, results: [{ title, url, content, score }] }.
 */
export async function tavilySearch(query, { maxResults = 5 } = {}) {
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

  const data = await res.json();
  return {
    query,
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
 * Runs several Tavily queries in parallel. Individual query failures are
 * swallowed (logged) rather than aborting the whole research run — partial
 * evidence is still useful, and one bad query shouldn't kill the request.
 */
export async function tavilySearchMany(queries, opts) {
  const settled = await Promise.allSettled(queries.map((q) => tavilySearch(q, opts)));
  return settled.map((result, i) => {
    if (result.status === 'fulfilled') return result.value;
    console.error(`Tavily query failed: "${queries[i]}"`, result.reason?.message);
    return { query: queries[i], answer: null, results: [], error: true };
  });
}

export function hasTavilyKeyConfigured() {
  return Boolean(getApiKey());
}
