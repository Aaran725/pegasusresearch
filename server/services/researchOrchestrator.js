import { tavilySearchMany, hasTavilyKeyConfigured, getTavilyUsage } from './tavilyClient.js';
import { synthesizeMemo, planFollowUps, identifyGaps } from './groqClient.js';
import { summarizeEvidenceGroups } from './evidenceSummarizer.js';
import { getCached, setCached } from './researchCache.js';

// Standard keeps today's numbers. Deep trades ~2.5x more Tavily credits for
// ~2x topic breadth, ~2x competitor depth, and up to 3 gap-filling rounds
// instead of 1 — see the "8x research" plan for the full cost/benefit
// table. Map-reduce evidence compression (evidenceSummarizer.js) applies to
// BOTH modes: it's a quality fix (more facts survive into the final prompt
// within whatever budget is in play), not an extra Tavily cost.
const DEPTH_PRESETS = {
  standard: {
    baseQueryCost: 5,
    maxCompetitorFollowups: 3,
    queriesPerCompetitor: 1,
    maxGapRounds: 1,
    maxGapQueriesPerRound: 4,
  },
  deep: {
    baseQueryCost: 10,
    maxCompetitorFollowups: 6,
    queriesPerCompetitor: 2,
    maxGapRounds: 3,
    maxGapQueriesPerRound: 4,
  },
};

function buildBaseQueryPlan(company, depth) {
  const label = 'BASE SEARCH';
  const queries = [
    { query: `${company} startup funding round valuation investors`, label },
    { query: `${company} competitors alternatives market`, label },
    { query: `${company} revenue ARR total addressable market size`, label },
    { query: `${company} news 2025`, label },
    { query: `${company} crunchbase OR pitchbook profile`, label },
  ];
  if (depth === 'deep') {
    queries.push(
      { query: `${company} pricing business model go-to-market monetization`, label: 'BASE: BUSINESS MODEL' },
      { query: `${company} technology stack patents proprietary IP`, label: 'BASE: TECH/IP' },
      { query: `${company} employees headcount engineering team hiring`, label: 'BASE: TEAM/HIRING' },
      { query: `${company} customers case study enterprise partnership integration`, label: 'BASE: CUSTOMERS' },
      { query: `${company} product launch roadmap release 2025 2026`, label: 'BASE: PRODUCT' }
    );
  }
  return queries;
}

function competitorQueries(name, queriesPerCompetitor) {
  const label = `COMPETITOR: ${name}`;
  const queries = [{ query: `${name} funding valuation revenue`, label }];
  if (queriesPerCompetitor >= 2) {
    queries.push({ query: `${name} product features pricing market position vs competitors`, label });
  }
  return queries;
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
 * Runs the full research pipeline for a company name at a given depth
 * ('standard' or 'deep'):
 *   1. Serve from cache if we have a recent-enough entry for this depth
 *      (unless forceRefresh)
 *   2. Base multi-query live web search (Tavily) — 5 clusters (standard) or
 *      10 (deep, adding business model, tech/IP, team, customers, product)
 *   3. A cheap Groq call names real (evidence-backed) competitors
 *   4. Follow-up searches: 1-2 queries per named competitor, plus a
 *      dedicated founder-background query and a dedicated risk/red-flag
 *      query — budget-permitting against the monthly Tavily quota
 *   5. Adaptive gap-filling: 1 round (standard) or up to 3 rounds (deep) —
 *      a cheap Groq call reviews everything gathered, flags fields still
 *      lacking support, and proposes targeted follow-up queries; each round
 *      re-assesses using evidence from prior rounds, stopping early once a
 *      round reports no more gaps
 *   6. Map-reduce compression: large evidence groups get condensed into
 *      dense, URL-cited facts before the final call, so the fixed
 *      evidence-block budget can hold facts from far more sources than raw
 *      snippets ever could
 *   7. Final evidence-grounded synthesis (Groq) over the compressed digest,
 *      citing or abstaining
 *
 * Returns { memo, researchTrace, cached, fetchedAt, stale? }.
 * Throws an error with `.code` set to 'no_evidence' | 'search_failed' |
 * 'synthesis_failed' | 'quota_exhausted' so the route layer can respond
 * with the right status and the client can show an accurate message.
 */
export async function runResearch(companyName, { forceRefresh = false, depth = 'standard' } = {}) {
  const preset = DEPTH_PRESETS[depth] ?? DEPTH_PRESETS.standard;

  if (!forceRefresh) {
    const cached = getCached(companyName, depth);
    if (cached) return { ...cached, cached: true };
  }

  if (!hasTavilyKeyConfigured()) {
    const err = new Error('TAVILY_API_KEY is not configured on the server');
    err.code = 'search_failed';
    throw err;
  }

  const { remaining } = getTavilyUsage();
  if (remaining < preset.baseQueryCost) {
    const err = new Error(
      `Tavily monthly search quota exhausted (${remaining} credits left, need at least ${preset.baseQueryCost})`
    );
    err.code = 'quota_exhausted';
    throw err;
  }

  const baseEvidence = await tavilySearchMany(buildBaseQueryPlan(companyName, depth));

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

  const competitorNames = await planFollowUps(companyName, baseEvidence, preset.maxCompetitorFollowups);
  const { remaining: afterCore } = getTavilyUsage();
  const costPerCompetitor = preset.queriesPerCompetitor;
  const affordableCompetitors = Math.min(
    competitorNames.length,
    preset.maxCompetitorFollowups,
    Math.max(0, Math.floor((afterCore - followUpQueries.length) / costPerCompetitor))
  );
  for (const name of competitorNames.slice(0, affordableCompetitors)) {
    followUpQueries.push(...competitorQueries(name, preset.queriesPerCompetitor));
  }

  const followUpEvidence = followUpQueries.length > 0 ? await tavilySearchMany(followUpQueries) : [];
  let evidenceSoFar = [...baseEvidence, ...followUpEvidence];

  // Adaptive gap-filling: look at what we actually have, not what we
  // assumed we'd get from the fixed query plan, and go dig specifically
  // for whatever's still missing — budget permitting, up to maxGapRounds.
  const gapEvidence = [];
  for (let round = 0; round < preset.maxGapRounds; round++) {
    const { remaining: beforeRound } = getTavilyUsage();
    if (beforeRound < 1) break;

    const gaps = await identifyGaps(companyName, [...evidenceSoFar, ...gapEvidence]);
    if (gaps.length === 0) break; // evidence already covers everything reasonably well

    const affordableGaps = gaps.slice(0, Math.min(gaps.length, preset.maxGapQueriesPerRound, beforeRound));
    if (affordableGaps.length === 0) break;

    const roundQueries = affordableGaps.map((g) => ({
      query: g.query,
      label: `GAP FILL R${round + 1}: ${g.field}`,
    }));
    const roundEvidence = await tavilySearchMany(roundQueries);
    gapEvidence.push(...roundEvidence);
  }

  const allEvidence = [...evidenceSoFar, ...gapEvidence];
  const researchTrace = toTrace(allEvidence);

  // Map-reduce: compress large groups into dense facts before the final
  // call so the fixed evidence budget holds far more distinct sources than
  // raw snippets alone would allow.
  const digest = await summarizeEvidenceGroups(companyName, allEvidence);

  let memo;
  try {
    memo = await synthesizeMemo(companyName, digest);
  } catch (cause) {
    const err = new Error(`Synthesis failed: ${cause.message}`);
    err.code = 'synthesis_failed';
    err.researchTrace = researchTrace;
    throw err;
  }

  const finalMemo = { ...memo, isGenerated: false, source: 'groq+tavily' };
  const entry = setCached(companyName, depth, { memo: finalMemo, researchTrace });

  return { ...entry, cached: false };
}
