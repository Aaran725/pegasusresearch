import { tavilySearchMany, hasTavilyKeyConfigured, getTavilyUsage } from './tavilyClient.js';
import { synthesizeMemo, planFollowUps } from './groqClient.js';
import { getCached, setCached } from './researchCache.js';

const BASE_QUERY_COST = 5; // one query per entry below
const MAX_COMPETITOR_FOLLOWUPS = 3;

function buildBaseQueryPlan(company) {
  const label = 'BASE SEARCH';
  return [
    { query: `${company} startup funding round valuation investors`, label },
    { query: `${company} competitors alternatives market`, label },
    { query: `${company} revenue ARR total addressable market size`, label },
    { query: `${company} news 2025`, label },
    { query: `${company} crunchbase OR pitchbook profile`, label },
  ];
}

function countTotalResults(evidenceBundle) {
  return evidenceBundle.reduce((sum, g) => sum + g.results.length, 0);
}

function toTrace(evidenceBundle) {
  return evidenceBundle.map((g) => ({
    query: g.query,
    label: g.label,
    resultCount: g.results.length,
    failed: Boolean(g.error),
  }));
}

/**
 * Runs the full research pipeline for a company name:
 *   1. Serve from cache if we have a recent-enough entry (unless forceRefresh)
 *   2. Base multi-query live web search (Tavily)
 *   3. A cheap Groq call names up to 3 real (evidence-backed) competitors
 *   4. Follow-up searches: one per named competitor, plus a dedicated
 *      founder-background query and a dedicated risk/red-flag query —
 *      budget-permitting against the monthly Tavily quota
 *   5. Final evidence-grounded synthesis (Groq), citing or abstaining
 *
 * Returns { memo, researchTrace, cached, fetchedAt, stale? }.
 * Throws an error with `.code` set to 'no_evidence' | 'search_failed' |
 * 'synthesis_failed' | 'quota_exhausted' so the route layer can respond
 * with the right status and the client can show an accurate message.
 */
export async function runResearch(companyName, { forceRefresh = false } = {}) {
  if (!forceRefresh) {
    const cached = getCached(companyName);
    if (cached) return { ...cached, cached: true };
  }

  if (!hasTavilyKeyConfigured()) {
    const err = new Error('TAVILY_API_KEY is not configured on the server');
    err.code = 'search_failed';
    throw err;
  }

  const { remaining } = getTavilyUsage();
  if (remaining < BASE_QUERY_COST) {
    const err = new Error(
      `Tavily monthly search quota exhausted (${remaining} credits left, need at least ${BASE_QUERY_COST})`
    );
    err.code = 'quota_exhausted';
    throw err;
  }

  const baseEvidence = await tavilySearchMany(buildBaseQueryPlan(companyName));

  const allQueriesFailed = baseEvidence.every((g) => g.error);
  if (allQueriesFailed) {
    const err = new Error('Web search failed for every query — Tavily may be unreachable or rate-limited');
    err.code = 'search_failed';
    err.researchTrace = toTrace(baseEvidence);
    throw err;
  }

  if (countTotalResults(baseEvidence) === 0) {
    const err = new Error(`No public web evidence found for "${companyName}"`);
    err.code = 'no_evidence';
    err.researchTrace = toTrace(baseEvidence);
    throw err;
  }

  // Follow-up depth pass: founder background + risk signals are cheap (1
  // query each) and high-value, so they go first; whatever budget remains
  // goes to per-competitor deep-dives.
  const followUpQueries = [];
  const { remaining: afterBase } = getTavilyUsage();
  if (afterBase >= 2) {
    followUpQueries.push(
      { query: `${companyName} founder CEO co-founder background`, label: 'FOUNDER BACKGROUND' },
      { query: `${companyName} lawsuit OR layoffs OR controversy OR investigation OR regulatory`, label: 'RISK SIGNALS' }
    );
  }

  const competitorNames = await planFollowUps(companyName, baseEvidence);
  const { remaining: afterCore } = getTavilyUsage();
  const affordableCompetitors = Math.min(
    competitorNames.length,
    MAX_COMPETITOR_FOLLOWUPS,
    Math.max(0, afterCore - followUpQueries.length)
  );
  for (const name of competitorNames.slice(0, affordableCompetitors)) {
    followUpQueries.push({
      query: `${name} funding valuation revenue`,
      label: `COMPETITOR: ${name}`,
    });
  }

  const followUpEvidence = followUpQueries.length > 0 ? await tavilySearchMany(followUpQueries) : [];
  const allEvidence = [...baseEvidence, ...followUpEvidence];
  const researchTrace = toTrace(allEvidence);

  let memo;
  try {
    memo = await synthesizeMemo(companyName, allEvidence);
  } catch (cause) {
    const err = new Error(`Synthesis failed: ${cause.message}`);
    err.code = 'synthesis_failed';
    err.researchTrace = researchTrace;
    throw err;
  }

  const finalMemo = { ...memo, isGenerated: false, source: 'groq+tavily' };
  const entry = setCached(companyName, { memo: finalMemo, researchTrace });

  return { ...entry, cached: false };
}
