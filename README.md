# Pegasus Analyst AI

A VC startup research dashboard that turns a company name (or URL) into a
first-pass investment memo — valuation, funding history, market sizing,
competitor landscape, and comps — grounded in live web search, with every
number cited back to a source.

## Stack

- **Frontend:** React 19 + Vite, Tailwind CSS v4, Recharts, Lucide React
- **Backend:** Express (Node), holds all API keys server-side
- **Research pipeline:** Tavily (live web search) → Groq/Llama 3.3 70B
  (evidence-grounded synthesis, cite-or-abstain)

## Why there's a backend

Vite inlines any `VITE_`-prefixed env var into the client bundle — so a
frontend-only version of this app would ship its API keys to every visitor's
browser, readable straight out of dev tools. All secrets now live in
`server/`, loaded from `.env` with plain (non-`VITE_`) names, and the
browser only ever talks to our own `/api/*` routes.

## Getting started

```bash
npm install
cp .env.example .env   # fill in Groq + Tavily keys (see below)
npm run dev            # runs the Vite dev server AND the API server together
```

Open the URL Vite prints (usually `http://localhost:5173`). The Vite dev
server proxies `/api/*` to the Express server on port 3001 (see
`vite.config.js`), so it looks like one app during development.

For production: `npm run build` then `npm start` (Express serves the built
frontend and the API from one process).

## API keys

- **Groq** (https://console.groq.com/keys) — free tier. Up to 3 keys can be
  set (`GROQ_API_KEY`, `_2`, `_3`) and are rotated on failure/rate-limit.
- **Tavily** (https://tavily.com) — free tier, 1,000 search credits/month.
  Each research run costs 5 credits (one per query in the search plan), so
  the free tier covers roughly 200 company searches/month.

## How research works

`server/services/researchOrchestrator.js` runs the pipeline per search:

1. **Multi-query live search** (Tavily) — funding/valuation, competitors,
   revenue/TAM, recent news, and a Crunchbase/PitchBook-targeted query.
2. **Evidence-grounded synthesis** (Groq) — the model is instructed to cite
   every numeric claim to a specific source snippet, or return `null`/omit
   the entry rather than guess. It also rates its own confidence per field
   (`verified` / `inferred` / `unavailable`).
3. The frontend renders the result with inline source links, confidence
   badges, and an expandable "Research trace" panel showing every query run
   — so a human can audit the work instead of taking it on faith.

If Tavily/Groq are unreachable, misconfigured, or find nothing for a given
name, the app falls back to `src/data/mockStartups.js` — curated data for a
couple of well-known companies, or a deterministic generator for anything
else — clearly labeled as demo/directional data, never presented as real
research. The UI distinguishes exactly why it fell back (search
unreachable vs. no evidence found vs. synthesis failed) rather than showing
one generic error.

**Honest limitation:** this gets you a cited first-pass draft from the
*public* web. It does not replace data-room access, reference calls, or
paid terminals (PitchBook/Crunchbase Pro) — nothing free-tier can.

## Project layout

```
server/
  index.js                    Express entry point (dev: API only; prod: API + static frontend)
  routes/research.js          POST /api/research
  services/tavilyClient.js    Live web search
  services/groqClient.js      Evidence-grounded LLM synthesis
  services/researchOrchestrator.js   Wires the two together, error classification

src/
  components/    UI building blocks (charts, tables, sidebar, header)
  data/          Mock/generated fallback startup data
  services/researchService.js   Client -> our own backend (never calls Groq/Tavily directly)
```

## Environment variables

See `.env.example`. Never commit `.env` — it's gitignored.
