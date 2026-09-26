// Live AI-analyst path: asks Groq for a structured investment memo in the
// exact JSON shape src/data/mockStartups.js already produces, so every
// component that renders startup data is agnostic to whether it came from
// the LLM or the mock generator.
//
// Three keys are rotated on failure (rate limit, transient network error)
// so a single exhausted free-tier key doesn't take the feature down.

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

function getApiKeys() {
  return [
    import.meta.env.VITE_GROQ_API_KEY,
    import.meta.env.VITE_GROQ_API_KEY_2,
    import.meta.env.VITE_GROQ_API_KEY_3,
  ].filter(Boolean);
}

const SYSTEM_PROMPT = `You are a senior VC analyst at Pegasus Tech Ventures producing a first-pass investment memo.
Given a startup name, respond with ONLY a single JSON object (no markdown fences, no commentary) matching exactly this shape:

{
  "name": string,
  "ticker": string (short uppercase slug),
  "sector": string,
  "stage": string (funding stage, e.g. "Series B"),
  "pitch": string (one sentence),
  "logoInitial": string (single uppercase letter),
  "valuation": string (e.g. "$4.8B"),
  "valuationTrend": string (e.g. "+18%"),
  "totalRaised": string (e.g. "$620M"),
  "raisedTrend": string (e.g. "+42%"),
  "leadInvestors": string (comma separated names),
  "leadInvestorNote": string (e.g. "Series C · Apr 2024"),
  "tam": string (e.g. "$92B"),
  "tamTrend": string (e.g. "+9%"),
  "aiVerdict": string (3-5 sentences, weighing the investment through a deep-tech / physical-AI / global-expansion thesis, citing both upside and risk),
  "fundingHistory": [ { "round": string, "year": string, "valuation": number (in $B), "raised": number (in $B) } ] (3-6 entries, chronological),
  "marketSizing": [
    { "name": "TAM", "label": "Total Addressable Market", "value": number (in $M), "color": "#3B82F6" },
    { "name": "SAM", "label": "Serviceable Addressable Market", "value": number (in $M), "color": "#60A5FA" },
    { "name": "SOM", "label": "Serviceable Obtainable Market", "value": number (in $M), "color": "#93C5FD" }
  ],
  "competitors": [ { "name": string, "innovation": number (0-100), "traction": number (0-100), "raised": number (in $M), "subject": boolean } ] (exactly 4 entries, first one is the subject company with subject:true),
  "comps": [ { "name": string, "valuation": string, "revenue": string, "evRev": string, "growth": string, "up": boolean, "tier": "Tier 1 Lead"|"Fast Follower"|"Incumbent"|"Niche Player", "tone": "blue"|"amber"|"slate", "differentiator": string } ] (exactly 4 entries, first is the subject company)
}

Use your best real-world knowledge of the company if you recognize it. If you don't recognize it, produce plausible, clearly-labeled estimates consistent with its apparent sector and stage. Never include text outside the JSON object.`;

async function callGroq(apiKey, companyName) {
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
        { role: 'user', content: `Startup: ${companyName}` },
      ],
      temperature: 0.4,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const status = res.status;
    const body = await res.text().catch(() => '');
    const err = new Error(`Groq request failed (${status}): ${body.slice(0, 200)}`);
    err.status = status;
    throw err;
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq response missing content');

  return JSON.parse(content);
}

/**
 * Fetches an AI-generated investment memo for a startup name/URL.
 * Rotates across up to 3 API keys on failure. Throws if all keys fail —
 * callers should catch and fall back to the mock data generator.
 */
export async function fetchStartupMemo(companyName) {
  const keys = getApiKeys();
  if (keys.length === 0) {
    throw new Error('No Groq API keys configured (VITE_GROQ_API_KEY)');
  }

  let lastError;
  for (const key of keys) {
    try {
      const memo = await callGroq(key, companyName);
      return { ...memo, isGenerated: false, source: 'groq' };
    } catch (err) {
      lastError = err;
      // Rate-limited or auth error on this key — try the next one.
      continue;
    }
  }
  throw lastError ?? new Error('All Groq API keys failed');
}

export function hasGroqKeysConfigured() {
  return getApiKeys().length > 0;
}
