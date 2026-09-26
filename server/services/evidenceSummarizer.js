// Map-reduce evidence compression. Groq's free tier has a hard token
// ceiling per synthesis call (~8,000 TPM on some models — a real
// production limit, not theoretical), and groqClient.js's evidence-block
// budget caps total evidence text regardless of how many Tavily queries
// were fired. Firing more queries alone doesn't get more information into
// the final memo once that budget is full — it just means each individual
// group's raw-text share shrinks.
//
// The fix: before the final synthesis call, run each LARGE evidence group
// through a small, cheap Groq call that extracts a handful of concrete,
// URL-cited facts — a "map" step. A fact is far more information-dense
// than a raw 700-char snippet (which is often padding, boilerplate, or a
// half-finished sentence at the truncation point), so the same fixed
// evidence budget can hold facts from several times as many sources.
// Small groups skip this and pass through raw, unsummarized — no point
// spending a Groq call (or losing fidelity) on a group that already fits.
//
// Output groups keep the EXACT shape groqClient.js's buildEvidenceBlock()
// already expects ({ query, label, answer, results: [{title,url,content}] }),
// so the "reduce" step (synthesizeMemo) needs zero changes — callers just
// pass the digest array instead of raw evidence.

import { runJSONPrompt } from './groqClient.js';

// Groups with less raw text than this pass through unsummarized.
const MAP_SUMMARIZE_THRESHOLD_CHARS = 1500;
const MAX_FACTS_PER_GROUP = 5;
const FACT_MAX_CHARS = 180;
const MAP_MAX_TOKENS = 350;

// A burst of many small Groq calls at once risks Groq's account-level
// requests-per-minute limit — a different failure mode than any single
// model's tokens-per-minute ceiling (already hit once this session).
// Capping peak concurrency and staggering batch starts avoids ever
// bursting past it, same philosophy as tavilyClient.js's approach to the
// exact same class of problem on the Tavily side.
const DEFAULT_CONCURRENCY = 4;
const DEFAULT_STAGGER_MS = 300;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function groupRawLength(group) {
  const answerLen = group.answer ? group.answer.length : 0;
  const resultsLen = group.results.reduce(
    (sum, r) => sum + (r.content?.length ?? 0) + (r.title?.length ?? 0),
    0
  );
  return answerLen + resultsLen;
}

function formatGroupForMapPrompt(group) {
  let text = '';
  if (group.answer) text += `Quick answer: ${group.answer}\n\n`;
  for (const r of group.results) {
    text += `[${r.title}]\nURL: ${r.url}\n${(r.content || '').slice(0, 2000)}\n\n`;
  }
  return text || '(no content)';
}

/** Never silently drops a group — worst case, a truncated raw sample. */
function truncatedFallback(group) {
  return {
    ...group,
    results: group.results.slice(0, 2).map((r) => ({ ...r, content: (r.content || '').slice(0, 400) })),
  };
}

const MAP_SYSTEM_PROMPT = `You extract concrete, VC-relevant facts from one batch of web-search results about a company, so they can be compactly fed into a later report-writing step without losing what matters. Read the results carefully. Extract up to 5 distinct, concrete facts — each one a specific claim (a number, a name, a date, an event), not a vague summary sentence. Each fact must be traceable to one specific URL from the results given. Respond with ONLY JSON: { "facts": [ { "text": string (<=180 chars, one concrete claim), "url": string (must be one of the result URLs given) } ] }. If the results genuinely contain nothing concrete or useful, return an empty array — don't manufacture filler facts to seem thorough.`;

/**
 * Summarizes ONE evidence group into a compact digest group with the same
 * shape buildEvidenceBlock() already consumes. Groups under the size
 * threshold pass through unchanged (no Groq call spent). On any failure —
 * malformed response, model error, zero facts extracted — falls back to a
 * truncated raw sample rather than dropping the group's evidence entirely.
 */
export async function summarizeGroup(companyName, group) {
  if (groupRawLength(group) < MAP_SUMMARIZE_THRESHOLD_CHARS) {
    return group;
  }

  try {
    const userContent = `Company: ${companyName}\nSearch query this batch came from: ${group.query}\n\nResults:\n${formatGroupForMapPrompt(group)}`;
    const result = await runJSONPrompt(MAP_SYSTEM_PROMPT, userContent, MAP_MAX_TOKENS);
    const facts = Array.isArray(result?.facts) ? result.facts : [];
    const validFacts = facts
      .filter((f) => f && typeof f.text === 'string' && f.text.trim() && typeof f.url === 'string' && f.url.trim())
      .slice(0, MAX_FACTS_PER_GROUP)
      .map((f) => ({ text: f.text.slice(0, FACT_MAX_CHARS), url: f.url }));

    if (validFacts.length === 0) return truncatedFallback(group);

    return {
      query: group.query,
      label: group.label,
      answer: null,
      results: validFacts.map((f, i) => ({ title: `Fact ${i + 1}`, url: f.url, content: f.text, score: 1 })),
    };
  } catch (err) {
    console.error(`[evidenceSummarizer] map call failed for "${group.query}", using truncated raw fallback:`, err.message);
    return truncatedFallback(group);
  }
}

/**
 * Runs summarizeGroup across a whole evidence bundle, processing in
 * fixed-size concurrency batches (not just staggered starts — a true cap
 * on how many map calls are ever in flight at once) so a large Deep-mode
 * bundle (25-30+ groups) can't burst past Groq's request-rate limits.
 */
export async function summarizeEvidenceGroups(
  companyName,
  evidenceBundle,
  { concurrency = DEFAULT_CONCURRENCY, staggerMs = DEFAULT_STAGGER_MS } = {}
) {
  const digest = new Array(evidenceBundle.length);

  for (let start = 0; start < evidenceBundle.length; start += concurrency) {
    const batch = evidenceBundle.slice(start, start + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map(async (group, i) => {
        if (i > 0) await sleep(i * staggerMs);
        return summarizeGroup(companyName, group);
      })
    );
    batchResults.forEach((result, i) => {
      const idx = start + i;
      digest[idx] = result.status === 'fulfilled' ? result.value : truncatedFallback(evidenceBundle[idx]);
    });
  }

  return digest;
}
