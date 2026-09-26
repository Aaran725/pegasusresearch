// Client-side research service. This calls OUR OWN backend (server/), which
// holds the Groq + Tavily API keys server-side and never exposes them to
// the browser. The backend runs a live multi-query web search (Tavily) and
// synthesizes a cited, confidence-scored memo (Groq) from that evidence —
// see server/services/researchOrchestrator.js.

/**
 * Fetches a live, web-grounded investment memo for a company name.
 * Pass { forceRefresh: true } to bypass the server's 24h cache and re-run
 * the full search + synthesis pipeline (spends Tavily quota).
 *
 * Throws an Error with `.code` set to one of:
 *   'no_evidence'      — search ran fine, but found nothing on the open web
 *                         for this name (likely not a real/findable company)
 *   'search_failed'    — Tavily error, or not configured on the server
 *   'synthesis_failed' — Groq error after evidence was found
 *   'quota_exhausted'  — monthly Tavily search-credit budget is used up
 *   'network_error'    — couldn't reach our own backend at all
 *
 * Callers should catch and fall back to the mock data generator.
 */
export async function fetchStartupMemo(companyName, { forceRefresh = false } = {}) {
  let res;
  try {
    res = await fetch('/api/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company: companyName, forceRefresh }),
    });
  } catch (cause) {
    const err = new Error(`Could not reach the research backend: ${cause.message}`);
    err.code = 'network_error';
    throw err;
  }

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(body.message || `Research request failed (${res.status})`);
    err.code = body.error ?? 'network_error';
    err.researchTrace = body.researchTrace ?? [];
    throw err;
  }

  return {
    ...body.memo,
    researchTrace: body.researchTrace ?? [],
    cached: Boolean(body.cached),
    fetchedAt: body.fetchedAt ?? null,
    stale: Boolean(body.stale),
  };
}

/** Fetches current Tavily search-credit usage for the calendar month. */
export async function fetchQuotaUsage() {
  const res = await fetch('/api/quota');
  if (!res.ok) throw new Error(`Quota request failed (${res.status})`);
  return res.json();
}
