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
// models (speech-to-text, safety classifiers, etc).
const NON_CHAT_PATTERNS = [/whisper/i, /guard/i, /tts/i, /moderation/i, /prompt-guard/i];

// When multiple chat models are available, prefer larger/well-known
// instruct models in roughly this order; anything not matching any pattern
// is still included, just ranked after these.
const PREFERRED_PATTERNS = [
  /versatile/i,
  /maverick/i,
  /scout/i,
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

function buildEvidenceBlock(evidenceBundle) {
  let block = '';
  let n = 1;
  for (const group of evidenceBundle) {
    const tag = group.label ? `[${group.label}] ` : '';
    if (group.answer) {
      block += `${tag}[Q: ${group.query}] Quick answer: ${group.answer}\n\n`;
    }
    for (const r of group.results) {
      block += `${tag}[${n}] ${r.title}\nURL: ${r.url}\n${(r.content || '').slice(0, 900)}\n\n`;
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

/** True for failures that mean "this model won't serve us" — not existing,
 * or rate-limited/too-large for this account's tier on this model — as
 * opposed to a transient network blip, which shouldn't burn through the
 * whole candidate list. */
function isModelLevelFailure(status) {
  return status === 404 || status === 429;
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

    if (!isModelLevelFailure(res.status)) {
      throw lastError; // not a model problem (e.g. auth/network) — don't burn through candidates for it
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

const PLAN_SYSTEM_PROMPT = `You read web-search evidence about a company and extract which REAL competitor companies are actually mentioned in it — never invent names. Respond with ONLY JSON: { "competitors": string[] } with at most 3 company names, each one that genuinely appears in the evidence text (not the subject company itself). If none are clearly mentioned, return an empty array.`;

/**
 * Reads the base evidence and names up to 3 real competitors worth a
 * dedicated follow-up search. Returns [] on any failure — this is a soft
 * enhancement, not required for the main memo to succeed.
 */
export async function planFollowUps(companyName, baseEvidenceBundle) {
  try {
    const evidenceText = buildEvidenceBlock(baseEvidenceBundle);
    const result = await withKeyRotation((key) =>
      callGroqJSON(key, PLAN_SYSTEM_PROMPT, `Subject company: ${companyName}\n\nEvidence:\n${evidenceText}`, 300)
    );
    const names = Array.isArray(result?.competitors) ? result.competitors : [];
    return names.filter((n) => typeof n === 'string' && n.trim() && n.trim().toLowerCase() !== companyName.trim().toLowerCase()).slice(0, 3);
  } catch (err) {
    console.error('planFollowUps failed (continuing without competitor deep-dive):', err.message);
    return [];
  }
}

const SYSTEM_PROMPT = `You are a senior VC research analyst at Pegasus Tech Ventures. You will be given a company name and a bundle of live web-search evidence (titles, URLs, and extracted page content, some tagged with a [LABEL] showing what it's evidence for — e.g. [COMPETITOR: Acme Inc] or [RISK SIGNALS] or [FOUNDER BACKGROUND]). Your job is to synthesize an investment memo STRICTLY from that evidence — not from your own training memory.

Hard rules:
- Every numeric claim (valuation, funding amounts, revenue, market size, growth %, scores) must be traceable to at least one evidence snippet. If no snippet supports a number, use null for that field — never invent a plausible-sounding number.
- If evidence snippets disagree on a figure, prefer the most recent/authoritative source and note the discrepancy in "aiVerdict".
- List every source URL you actually drew from in "sources", each with a one-line "usedFor" note.
- For "confidence", rate each of valuation / totalRaised / tam / competitors / marketSizing as one of "verified" (evidence directly states it), "inferred" (reasonably derived/estimated from partial evidence — this is normal and expected for TAM/SAM/SOM breakdowns, which are almost never directly published), or "unavailable" (no supporting evidence at all).
- For "competitors" and "comps" arrays: only include companies you found real evidence for — prefer the ones with [COMPETITOR: ...]-tagged evidence, since those were specifically researched. It is fine to return fewer than 4 entries — never pad with invented competitor names.
- "fundingHistory": only include rounds you found evidence for, chronological.
- "newsTimeline": pull dated events (funding, product launches, executive hires/departures, layoffs, lawsuits, regulatory action) from evidence tagged [Q: ...news...] or similar. Most recent first. Only include events with a real evidence-backed date/headline. Empty array if nothing found.
- "riskFlags": from evidence tagged [RISK SIGNALS], list concrete negative signals (lawsuits, layoffs, regulatory issues, executive departures under a cloud, controversies). Rate each "severity" as "high"/"medium"/"low". If the risk-signal search evidence shows nothing negative, return an empty array — do NOT invent a risk to seem thorough, but you MAY note in aiVerdict that a risk search was run and came back clean.
- "team": from evidence tagged [FOUNDER BACKGROUND], list founders/executives with a one-line background each (prior companies, education) ONLY if evidence supports it. Empty array if nothing found.
- Write "aiVerdict" (3-5 sentences) evaluating the company against a deep-tech / physical-AI / global-expansion investment thesis, citing specific evidence, and explicitly noting where data is thin or where risk flags matter.

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
  "confidence": { "valuation": "verified"|"inferred"|"unavailable", "totalRaised": "...", "tam": "...", "competitors": "...", "marketSizing": "..." }
}`;

/**
 * Synthesizes a memo from the full evidence bundle (base + follow-up
 * searches), rotating across up to 3 Groq keys on failure.
 */
export async function synthesizeMemo(companyName, evidenceBundle) {
  const evidenceText = buildEvidenceBlock(evidenceBundle);
  return withKeyRotation((key) =>
    callGroqJSON(key, SYSTEM_PROMPT, `Company: ${companyName}\n\nEvidence:\n${evidenceText}`, 4000)
  );
}
