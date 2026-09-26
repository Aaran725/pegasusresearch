import { tavilySearchMany, hasTavilyKeyConfigured } from './tavilyClient.js';
import { synthesizeMemo } from './groqClient.js';

// One research run spends 5 Tavily credits (1 per query, "basic" depth).
// Free tier is 1,000 credits/month -> ~200 company research runs/month.
function buildQueryPlan(company) {
  return [
    `${company} startup funding round valuation investors`,
    `${company} competitors alternatives market`,
    `${company} revenue ARR total addressable market size`,
    `${company} news 2025`,
    `${company} crunchbase OR pitchbook profile`,
  ];
}

function countTotalResults(evidenceBundle) {
  return evidenceBundle.reduce((sum, g) => sum + g.results.length, 0);
}

/**
 * Runs the full research pipeline for a company name:
 *   1. Multi-query live web search (Tavily)
 *   2. If literally nothing came back, treat as "not found" rather than
 *      letting the LLM synthesize from zero evidence
 *   3. Evidence-grounded synthesis (Groq), which cites-or-abstains per field
 *
 * Returns { memo, researchTrace } on success.
 * Throws an error with `.code` set to 'no_evidence' | 'search_failed' |
 * 'synthesis_failed' so the route layer can respond with the right status
 * and the client can show an accurate message instead of a generic one.
 */
export async function runResearch(companyName) {
  if (!hasTavilyKeyConfigured()) {
    const err = new Error('TAVILY_API_KEY is not configured on the server');
    err.code = 'search_failed';
    throw err;
  }

  const queries = buildQueryPlan(companyName);
  const evidenceBundle = await tavilySearchMany(queries, { maxResults: 5 });

  const researchTrace = evidenceBundle.map((g) => ({
    query: g.query,
    resultCount: g.results.length,
    failed: Boolean(g.error),
  }));

  const allQueriesFailed = evidenceBundle.every((g) => g.error);
  if (allQueriesFailed) {
    // The search API itself is unreachable/erroring — do NOT report this as
    // "no evidence found", which would wrongly imply the company doesn't
    // exist. Surface it as an infrastructure failure instead.
    const err = new Error('Web search failed for every query — Tavily may be unreachable or rate-limited');
    err.code = 'search_failed';
    err.researchTrace = researchTrace;
    throw err;
  }

  if (countTotalResults(evidenceBundle) === 0) {
    const err = new Error(`No public web evidence found for "${companyName}"`);
    err.code = 'no_evidence';
    err.researchTrace = researchTrace;
    throw err;
  }

  let memo;
  try {
    memo = await synthesizeMemo(companyName, evidenceBundle);
  } catch (cause) {
    const err = new Error(`Synthesis failed: ${cause.message}`);
    err.code = 'synthesis_failed';
    err.researchTrace = researchTrace;
    throw err;
  }

  return {
    memo: { ...memo, isGenerated: false, source: 'groq+tavily' },
    researchTrace,
  };
}
