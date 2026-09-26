// Server-side Groq client. Two call types:
//   planFollowUps  — cheap, small-schema call that reads the base evidence
//                    and names real (evidence-backed) competitors worth
//                    researching individually, rather than letting the
//                    final synthesis invent comp names from thin air.
//   synthesizeMemo — the main call. Synthesizes strictly from whatever
//                    evidence the orchestrator assembled (base + per-
//                    competitor + founder + risk searches), citing or
//                    abstaining on every claim.
//
// Model selection is a ranked FALLBACK CHAIN, not one hardcoded/auto-picked
// model — two real production failures already showed why a single choice
// isn't safe: (1) a hardcoded model can just stop existing (Groq deprecates
// models fairly often), and (2) different models have wildly different
// per-account rate limits on Groq's free tier, so even a live, valid model
// can be too rate-limited to serve a given request. Rather than guess one
// "best" model, we rank Groq's live model list by preference and walk down
// it on any 404 (model gone) or 429 (rate-limited/too-large-for-this-tier),
// remembering whichever one last actually worked.

const GROQ_CHAT_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODELS_ENDPOINT = 'https://api.groq.com/openai/v1/models';

// Filters out models that exist on Groq but aren't general chat/instruct
// models — speech-to-text (whisper), text-to-speech (orpheus/canopylabs,
// playai), safety classifiers (guard), etc. This list is inherently a
// best-effort guess at Groq's current lineup (no live access to verify
// from here) — a model slipping through gets caught downstream anyway by
// isModelLevelFailure() when it fails in a model-specific way.
const NON_CHAT_PATTERNS = [
  /whisper/i,
  /guard/i,
  /\btts\b/i,
  /moderation/i,
  /prompt-guard/i,
  /orpheus/i,
  /canopylabs/i,
  /playai/i,
];

// When multiple chat models are available, prefer larger/well-known
// instruct models in roughly this order; anything not matching any pattern
// is still included, just ranked after these.
const PREFERRED_PATTERNS = [
  /versatile/i,
  /maverick/i,
  /scout/i,
  /gpt-oss-120b/i,
  /gpt-oss/i,
  /405b/i,
  /72b/i,
  /70b/i,
  /deepseek/i,
  /qwen.*(32b|72b)/i,
  /mixtral/i,
  /gemma2/i,
  /llama-3\.[13]/i,
];

let cachedRanked = null; // full ranked candidate list for this process
let workingIndex = 0; // index into cachedRanked of the last model that worked

function getApiKeys() {
  return [process.env.GROQ_API_KEY, process.env.GROQ_API_KEY_2, process.env.GROQ_API_KEY_3].filter(
    Boolean
  );
}

async function fetchAvailableModels(apiKey) {
  const res = await fetch(GROQ_MODELS_ENDPOINT, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Could not list Groq models (${res.status}): ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  return (data.data ?? [])
    .map((m) => m.id)
    .filter((id) => id && !NON_CHAT_PATTERNS.some((p) => p.test(id)));
}

function rankModels(ids) {
  const ranked = [];
  const remaining = new Set(ids);
  for (const pattern of PREFERRED_PATTERNS) {
    const match = ids.find((id) => remaining.has(id) && pattern.test(id));
    if (match) {
      ranked.push(match);
      remaining.delete(match);
    }
  }
  return [...ranked, ...remaining];
}

async function getCandidates(apiKey) {
  if (!cachedRanked) {
    const ids = await fetchAvailableModels(apiKey);
    if (ids.length === 0) throw new Error('Groq returned no usable chat models');
    cachedRanked = rankModels(ids);
    workingIndex = 0;
    console.log(`[groq] model candidates (ranked): ${cachedRanked.join(', ')}`);
  }
  return cachedRanked;
}

/** Exposed for GET /api/health so you can see what model is actually in use. */
export function getResolvedModelName() {
  if (process.env.GROQ_MODEL) return process.env.GROQ_MODEL;
  return cachedRanked?.[workingIndex] ?? null;
}

// Hard cap on total evidence text, in characters (~4 chars/token, so this
// is a ~2,000-token budget). Groq's free tier commonly caps some models at
// as little as 8,000 tokens-per-minute TOTAL (prompt + completion) — an
// uncapped evidence block (previously: every result from every query, each
// up to 900 chars, with 5-10 query groups) could easily run 10-12k tokens
// on its own, which no amount of model-hopping fixes. Budget is split
// evenly PER GROUP (not per result) so base-search volume can't crowd out
// the smaller, high-value follow-up groups (risk signals, founder
// background, per-competitor evidence) that arrive later in the array.
// Real runs have measured comfortably under the 8k TPM limit even at these
// higher numbers (previous, more conservative values were cutting real
// content — e.g. a competitor mention 600 chars into an article — before
// the model ever saw it), so there's real margin to spend here.
const TOTAL_EVIDENCE_CHAR_BUDGET = 12000;
const SNIPPET_CHAR_CAP = 700;

/** Exported so evidenceSummarizer.js (map-reduce compression) can build the
 * same evidence-block format for a single group without duplicating this
 * budgeting logic. */
export function buildEvidenceBlock(evidenceBundle) {
  const groups = evidenceBundle.filter((g) => g.answer || g.results.length > 0);
  const perGroupBudget = Math.max(400, Math.floor(TOTAL_EVIDENCE_CHAR_BUDGET / (groups.length || 1)));

  let block = '';
  let n = 1;
  for (const group of groups) {
    // The per-group floor above (max(400, …)) can push the sum of all
    // per-group shares past TOTAL_EVIDENCE_CHAR_BUDGET once a bundle has
    // many groups (Deep mode: 30+) — that floor exists so a handful of
    // groups never gets starved to near-zero, but it's not a substitute for
    // an actual total cap. Stop appending once the real budget is spent,
    // regardless of how many groups are left.
    if (block.length >= TOTAL_EVIDENCE_CHAR_BUDGET) break;

    const tag = group.label ? `[${group.label}] ` : '';
    let used = 0;

    if (group.answer) {
      const line = `${tag}[Q: ${group.query}] Quick answer: ${group.answer}\n\n`;
      block += line;
      used += line.length;
    }

    for (const r of group.results) {
      const entry = `${tag}[${n}] ${r.title}\nURL: ${r.url}\n${(r.content || '').slice(0, SNIPPET_CHAR_CAP)}\n\n`;
      if (used > 0 && used + entry.length > perGroupBudget) break; // this group's share is spent
      block += entry;
      used += entry.length;
      n++;
    }
  }
  return block || '(no web evidence found)';
}

async function doChatCall(apiKey, model, systemPrompt, userContent, maxTokens) {
  return fetch(GROQ_CHAT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: 0.2,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
    }),
  });
}

// Groq (OpenAI-compatible) error bodies carry a structured error.code —
// prefer checking that over guessing at message wording, which is fragile
// and changes. Known model-specific codes seen in practice or documented:
// model doesn't exist, needs org terms acceptance, prompt too big for its
// context window, or plain rate-limited. New ones surface periodically
// (this list has grown from real production failures more than once) —
// the message-pattern fallback below catches ones not in this set yet.
const MODEL_LEVEL_ERROR_CODES = new Set([
  'model_not_found',
  'model_terms_required',
  'context_length_exceeded',
  'rate_limit_exceeded',
  'model_not_active',
  'model_decommissioned',
]);

const MODEL_LEVEL_MESSAGE_PATTERN =
  /reduce the length|context.{0,10}length|maximum.{0,20}tokens|too (long|many tokens)|terms acceptance|does not support|not supported for this model|decommissioned|deprecated/i;

/** True for failures that mean "this model won't serve us" — gone,
 * needs terms acceptance, too small a context window, rate-limited, or
 * otherwise incapable — as opposed to a genuine bad request (our own bug)
 * or a transient network blip, which shouldn't burn through the whole
 * candidate list. */
function isModelLevelFailure(status, bodyText) {
  if (status === 404 || status === 429 || status === 413) return true;
  if (status !== 400) return false;

  let code = null;
  let message = bodyText;
  try {
    const parsed = JSON.parse(bodyText);
    code = parsed?.error?.code ?? null;
    message = parsed?.error?.message ?? bodyText;
  } catch {
    // body wasn't JSON — fall back to matching the raw text
  }

  if (code && MODEL_LEVEL_ERROR_CODES.has(code)) return true;
  return MODEL_LEVEL_MESSAGE_PATTERN.test(message);
}

async function callGroqJSON(apiKey, systemPrompt, userContent, maxTokens) {
  if (process.env.GROQ_MODEL) {
    const res = await doChatCall(apiKey, process.env.GROQ_MODEL, systemPrompt, userContent, maxTokens);
    if (!res.ok) {
      const bodyText = await res.text().catch(() => '');
      throw Object.assign(new Error(`Groq request failed (${res.status}): ${bodyText.slice(0, 300)}`), {
        status: res.status,
      });
    }
    return parseChatResponse(res);
  }

  const candidates = await getCandidates(apiKey);
  let lastError;

  for (let attempt = 0; attempt < candidates.length; attempt++) {
    const idx = (workingIndex + attempt) % candidates.length;
    const model = candidates[idx];
    const res = await doChatCall(apiKey, model, systemPrompt, userContent, maxTokens);

    if (res.ok) {
      if (idx !== workingIndex) {
        console.log(`[groq] switched to model "${model}" (previous candidate failed)`);
      }
      workingIndex = idx;
      return parseChatResponse(res);
    }

    const bodyText = await res.text().catch(() => '');
    lastError = Object.assign(new Error(`Groq request failed (${res.status}): ${bodyText.slice(0, 300)}`), {
      status: res.status,
    });

    if (!isModelLevelFailure(res.status, bodyText)) {
      throw lastError; // not a model problem (e.g. auth/network/malformed request) — don't burn through candidates for it
    }
    console.error(`[groq] model "${model}" failed (${res.status}), trying next candidate:`, bodyText.slice(0, 200));
  }

  throw lastError ?? new Error('All Groq model candidates failed');
}

async function parseChatResponse(res) {
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq response missing content');
  return JSON.parse(content);
}

/** Rotates across up to 3 Groq keys, retrying the same call on each. */
async function withKeyRotation(fn) {
  const keys = getApiKeys();
  if (keys.length === 0) {
    throw new Error('No Groq API keys configured on the server');
  }
  let lastError;
  for (const key of keys) {
    try {
      return await fn(key);
    } catch (err) {
      lastError = err;
      continue;
    }
  }
  throw lastError ?? new Error('All Groq API keys failed');
}

/**
 * The shared "cheap JSON call" shape used by every small Groq call in this
 * module (competitor naming, gap detection, and — via evidenceSummarizer.js
 * — per-group evidence summarization): key rotation + model fallback chain,
 * parsed JSON out. Exported so evidenceSummarizer.js doesn't have to
 * reimplement this — it's the same reliability machinery that took several
 * rounds of real production failures to get right.
 */
export async function runJSONPrompt(systemPrompt, userContent, maxTokens) {
  return withKeyRotation((key) => callGroqJSON(key, systemPrompt, userContent, maxTokens));
}

function buildPlanSystemPrompt(maxCompetitors) {
  return `You read web-search evidence about a company and extract which REAL competitor/rival/alternative companies are mentioned anywhere in it — never invent names. Read carefully: company names often appear inside ordinary sentences (a "top alternatives to X" listicle, a funding article that name-drops rivals for context, an industry roundup), not just in an obviously labeled "competitors" section — scan every result's full text for other named companies in the same space, not just the first line. Respond with ONLY JSON: { "competitors": string[] } with up to ${maxCompetitors} company names genuinely present in the evidence text (never the subject company itself). Only return an empty array if you have checked every result and truly no other named company appears anywhere.`;
}

/**
 * Reads the base evidence and names up to `maxCompetitors` real competitors
 * worth a dedicated follow-up search. Returns [] on any failure — this is a
 * soft enhancement, not required for the main memo to succeed.
 */
export async function planFollowUps(companyName, baseEvidenceBundle, maxCompetitors = 3) {
  try {
    const evidenceText = buildEvidenceBlock(baseEvidenceBundle);
    const result = await runJSONPrompt(
      buildPlanSystemPrompt(maxCompetitors),
      `Subject company: ${companyName}\n\nEvidence:\n${evidenceText}`,
      300
    );
    const names = Array.isArray(result?.competitors) ? result.competitors : [];
    return names
      .filter((n) => typeof n === 'string' && n.trim() && n.trim().toLowerCase() !== companyName.trim().toLowerCase())
      .slice(0, maxCompetitors);
  } catch (err) {
    console.error('planFollowUps failed (continuing without competitor deep-dive):', err.message);
    return [];
  }
}

const CORE_GAP_FIELDS = ['valuation', 'funding_amount', 'funding_rounds', 'market_size', 'revenue', 'competitors'];
// Deep-only: these map 1:1 to the extra base clusters deep mode searches
// (business model, tech/IP, team/hiring, customers, product roadmap — see
// buildBaseQueryPlan in researchOrchestrator.js). Without this, deep mode's
// extra gap-fill rounds (2-3) just re-check the same 6 core fields round 1
// already resolved, so they almost always come back empty and the budget
// deep mode pays for those rounds goes unspent.
const DEEP_GAP_FIELDS = ['business_model', 'tech_ip', 'team', 'customers', 'product_roadmap'];

function buildGapSystemPrompt(fields) {
  const fieldList = fields.join(', ');
  return `You are a research assistant reviewing evidence gathered so far about a company, checking for gaps before a final report gets written. For EACH of these fields — ${fieldList} — check whether the evidence already contains clear supporting information. For any field that does NOT, write one specific, creative follow-up search query likely to find it: think like a researcher who hit a dead end and is trying a different angle (a specific source type like Crunchbase/TechCrunch/company blog, a specific recent time period, alternate phrasing, a specific event like "Series C announcement") — not a repeat of an obvious generic query. Respond with ONLY JSON: { "gaps": [ { "field": string (one of: ${fieldList}), "query": string } ] }, at most 4 entries, ordered by how important the gap is. If the evidence already covers everything reasonably well, return an empty array — don't manufacture gaps to seem thorough.`;
}

/**
 * Reviews evidence gathered so far, identifies which fields still lack
 * clear support, and proposes ONE targeted follow-up query per gap — the
 * "notice what's missing and go dig for it specifically" step a fixed
 * one-shot query batch can't do on its own. Returns [] on any failure;
 * this is a quality enhancement, not required for the memo to succeed.
 *
 * `depth` controls which fields get checked: standard only ever checks the
 * 6 core fields; deep also checks the 5 fields unique to deep mode's extra
 * base clusters, so its extra rounds have real, distinct gaps to find
 * instead of re-checking what round 1 already resolved.
 */
export async function identifyGaps(companyName, evidenceSoFar, depth = 'standard') {
  const fields = depth === 'deep' ? [...CORE_GAP_FIELDS, ...DEEP_GAP_FIELDS] : CORE_GAP_FIELDS;
  try {
    const evidenceText = buildEvidenceBlock(evidenceSoFar);
    const result = await runJSONPrompt(
      buildGapSystemPrompt(fields),
      `Company: ${companyName}\n\nEvidence gathered so far:\n${evidenceText}`,
      500
    );
    const gaps = Array.isArray(result?.gaps) ? result.gaps : [];
    return gaps
      .filter((g) => g && typeof g.query === 'string' && g.query.trim())
      .slice(0, 4);
  } catch (err) {
    console.error('identifyGaps failed (continuing without gap-filling round):', err.message);
    return [];
  }
}

const SYSTEM_PROMPT = `You are a senior VC research analyst at Pegasus Tech Ventures. You will be given a company name and a bundle of live web-search evidence (titles, URLs, and extracted page content, some tagged with a [LABEL] showing what it's evidence for — e.g. [COMPETITOR: Acme Inc] or [RISK SIGNALS] or [FOUNDER BACKGROUND]). Your job is to synthesize an investment memo STRICTLY from that evidence — not from your own training memory.

Hard rules:
- Every numeric claim (valuation, funding amounts, revenue, market size, growth %, scores) must be traceable to at least one evidence snippet. If no snippet supports a number, use null for that field — never invent a plausible-sounding number.
- If evidence snippets disagree on a figure, prefer the most recent/authoritative source and note the discrepancy in "aiVerdict".
- List every source URL you actually drew from in "sources", each with a one-line "usedFor" note.
- For "confidence", rate each of valuation / totalRaised / tam / competitors / marketSizing as one of "verified" (evidence directly states it), "inferred" (reasonably derived/estimated from partial evidence — this is normal and expected for TAM/SAM/SOM breakdowns, which are almost never directly published), or "unavailable" (no supporting evidence at all).
- For "competitors" and "comps" arrays: actively mine EVERY evidence block for named competitor companies — not just [COMPETITOR: ...]-tagged evidence. Company names routinely appear inside general [BASE SEARCH] results (a "competitors alternatives market" search result, a funding article that name-drops rivals for context, a news piece comparing the subject to others) — read for those mentions, don't wait for a dedicated tag. [COMPETITOR: ...]-tagged evidence just means that company was researched more deeply, so prefer using ITS evidence for that entry's specific numbers, but a company name mentioned only in [BASE SEARCH] evidence still belongs in these arrays with whatever partial data is available (scores/values you can't support stay null, per the rules above). Only return empty arrays if you have re-read all evidence and truly no other company is named anywhere. Never pad with invented competitor names.
- "fundingHistory": only include rounds you found evidence for, chronological.
- "newsTimeline": pull dated events (funding, product launches, executive hires/departures, layoffs, lawsuits, regulatory action) from evidence tagged [Q: ...news...] or similar. Most recent first. Only include events with a real evidence-backed date/headline. Empty array if nothing found.
- "riskFlags": from evidence tagged [RISK SIGNALS], list concrete negative signals (lawsuits, layoffs, regulatory issues, executive departures under a cloud, controversies). Rate each "severity" as "high"/"medium"/"low". If the risk-signal search evidence shows nothing negative, return an empty array — do NOT invent a risk to seem thorough, but you MAY note in aiVerdict that a risk search was run and came back clean.
- "team": from evidence tagged [FOUNDER BACKGROUND], list founders/executives with a one-line background each (prior companies, education) ONLY if evidence supports it. Empty array if nothing found.
- Write "aiVerdict" (3-5 sentences) evaluating the company against Pegasus Tech Ventures' actual, publicly-stated investment thesis — NOT a generic VC checklist: Pegasus explicitly rejects thematic/checklist investing and centers evaluation on (1) founding-team strength and the clarity of their market vision, (2) management experience, (3) technology innovation, and (4) financial projections, plus whether the company could benefit from Pegasus's Venture-Capital-as-a-Service model (35+ multinational corporate partners for business development, manufacturing, distribution, and global expansion). Cite specific evidence and explicitly note where data is thin or where risk flags matter.
- "pegasusFit": a structured scorecard mirroring the four criteria above, each with a 0-100 "score" and a one-sentence evidence-cited "note" — never invent a score with no supporting evidence; omit that sub-object entirely (leave it out of the JSON key, do not include a null placeholder) if there's truly nothing to base it on:
  - "team": founding-team strength / clarity of market vision, from [FOUNDER BACKGROUND] and general evidence.
  - "techInnovation": from [BASE: TECH/IP] evidence if present, else general evidence of technical differentiation.
  - "financials": from funding/valuation/revenue evidence — is there a coherent financial trajectory.
  - "vcaasFit": specifically whether this company's stage/geography/sector shows it could use a network of corporate partners for manufacturing, distribution, or international expansion — this is Pegasus's actual differentiator, treat it as a real evaluation axis, not filler.
- "businessModel", "techDifferentiation", "teamScale", "customers", "productRoadmap": these five fields exist ONLY to capture evidence tagged [BASE: BUSINESS MODEL], [BASE: TECH/IP], [BASE: TEAM/HIRING], [BASE: CUSTOMERS], and [BASE: PRODUCT] respectively (present only on deep-research runs — if none of these tags appear anywhere in the evidence, leave all five null). Each is one or two sentences of concrete, evidence-backed substance (pricing model, patents/proprietary tech, headcount trend, named customers/partners, an announced roadmap item) — null if that specific tag's evidence is too thin to say anything concrete. Do not fill these from other tags' evidence, and do not use them as a dumping ground for facts that belong in another field above.

Respond with ONLY a single JSON object, no markdown fences, matching exactly this shape:

{
  "name": string,
  "ticker": string (short uppercase slug),
  "sector": string,
  "stage": string,
  "pitch": string (one sentence),
  "logoInitial": string (single uppercase letter),
  "valuation": string | null,
  "valuationTrend": string | null,
  "totalRaised": string | null,
  "raisedTrend": string | null,
  "leadInvestors": string | null,
  "leadInvestorNote": string | null,
  "tam": string | null,
  "tamTrend": string | null,
  "aiVerdict": string,
  "fundingHistory": [ { "round": string, "year": string, "valuation": number (in $B), "raised": number (in $B) } ],
  "marketSizing": [
    { "name": "TAM", "label": "Total Addressable Market", "value": number (in $M), "color": "#3B82F6" },
    { "name": "SAM", "label": "Serviceable Addressable Market", "value": number (in $M), "color": "#60A5FA" },
    { "name": "SOM", "label": "Serviceable Obtainable Market", "value": number (in $M), "color": "#93C5FD" }
  ],
  "competitors": [ { "name": string, "innovation": number (0-100), "traction": number (0-100), "raised": number (in $M), "subject": boolean } ],
  "comps": [ { "name": string, "valuation": string, "revenue": string, "evRev": string, "growth": string, "up": boolean, "tier": "Tier 1 Lead"|"Fast Follower"|"Incumbent"|"Niche Player", "tone": "blue"|"amber"|"slate", "differentiator": string } ],
  "newsTimeline": [ { "date": string, "headline": string, "type": "funding"|"product"|"leadership"|"layoffs"|"legal"|"regulatory"|"other", "url": string } ],
  "riskFlags": [ { "severity": "high"|"medium"|"low", "description": string, "url": string } ],
  "team": [ { "name": string, "role": string, "background": string, "url": string } ],
  "sources": [ { "url": string, "title": string, "usedFor": string } ],
  "confidence": { "valuation": "verified"|"inferred"|"unavailable", "totalRaised": "...", "tam": "...", "competitors": "...", "marketSizing": "..." },
  "pegasusFit": {
    "team": { "score": number (0-100), "note": string } | omit key,
    "techInnovation": { "score": number (0-100), "note": string } | omit key,
    "financials": { "score": number (0-100), "note": string } | omit key,
    "vcaasFit": { "score": number (0-100), "note": string } | omit key
  },
  "businessModel": string | null,
  "techDifferentiation": string | null,
  "teamScale": string | null,
  "customers": string | null,
  "productRoadmap": string | null
}`;

/**
 * Synthesizes a memo from the full evidence bundle (base + follow-up
 * searches), rotating across up to 3 Groq keys on failure.
 */
export async function synthesizeMemo(companyName, evidenceBundle) {
  const evidenceText = buildEvidenceBlock(evidenceBundle);
  return runJSONPrompt(SYSTEM_PROMPT, `Company: ${companyName}\n\nEvidence:\n${evidenceText}`, 2000);
}
