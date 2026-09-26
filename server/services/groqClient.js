// Server-side Groq client. Unlike the old client-side version, this one
// does NOT ask the model to invent numbers from memory — it synthesizes
// strictly from the evidence bundle the research orchestrator assembled,
// and is required to cite or abstain on every numeric claim.

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

function getApiKeys() {
  return [process.env.GROQ_API_KEY, process.env.GROQ_API_KEY_2, process.env.GROQ_API_KEY_3].filter(
    Boolean
  );
}

const SYSTEM_PROMPT = `You are a senior VC research analyst at Pegasus Tech Ventures. You will be given a company name and a bundle of live web-search evidence (titles, URLs, and extracted page content). Your job is to synthesize an investment memo STRICTLY from that evidence — not from your own training memory.

Hard rules:
- Every numeric claim (valuation, funding amounts, revenue, market size, growth %, scores) must be traceable to at least one evidence snippet. If no snippet supports a number, use null for that field — never invent a plausible-sounding number.
- If evidence snippets disagree on a figure, prefer the most recent/authoritative source and note the discrepancy in "aiVerdict".
- List every source URL you actually drew from in "sources", each with a one-line "usedFor" note.
- For "confidence", rate each of valuation / totalRaised / tam / competitors / marketSizing as one of "verified" (evidence directly states it), "inferred" (reasonably derived/estimated from partial evidence — this is normal and expected for TAM/SAM/SOM breakdowns, which are almost never directly published), or "unavailable" (no supporting evidence at all).
- For "competitors" and "comps" arrays: only include companies you found real evidence for. It is fine to return fewer than 4 entries — never pad with invented competitor names.
- "fundingHistory": only include rounds you found evidence for, chronological.
- Write "aiVerdict" (3-5 sentences) evaluating the company against a deep-tech / physical-AI / global-expansion investment thesis, citing specific evidence, and explicitly noting where data is thin.

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
  "sources": [ { "url": string, "title": string, "usedFor": string } ],
  "confidence": { "valuation": "verified"|"inferred"|"unavailable", "totalRaised": "...", "tam": "...", "competitors": "...", "marketSizing": "..." }
}`;

function buildEvidenceBlock(evidenceBundle) {
  let block = '';
  let n = 1;
  for (const group of evidenceBundle) {
    if (group.answer) {
      block += `[Q: ${group.query}] Quick answer: ${group.answer}\n\n`;
    }
    for (const r of group.results) {
      block += `[${n}] ${r.title}\nURL: ${r.url}\n${(r.content || '').slice(0, 900)}\n\n`;
      n++;
    }
  }
  return block || '(no web evidence found)';
}

async function callGroq(apiKey, companyName, evidenceBundle) {
  const evidenceText = buildEvidenceBlock(evidenceBundle);

  const res = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Company: ${companyName}\n\nEvidence:\n${evidenceText}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const status = res.status;
    const body = await res.text().catch(() => '');
    const err = new Error(`Groq request failed (${status}): ${body.slice(0, 300)}`);
    err.status = status;
    throw err;
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq response missing content');
  return JSON.parse(content);
}

/**
 * Synthesizes a memo from evidence, rotating across up to 3 Groq keys on
 * failure (rate limit, transient error). Throws if every key fails.
 */
export async function synthesizeMemo(companyName, evidenceBundle) {
  const keys = getApiKeys();
  if (keys.length === 0) {
    throw new Error('No Groq API keys configured on the server');
  }

  let lastError;
  for (const key of keys) {
    try {
      return await callGroq(key, companyName, evidenceBundle);
    } catch (err) {
      lastError = err;
      continue;
    }
  }
  throw lastError ?? new Error('All Groq API keys failed');
}
