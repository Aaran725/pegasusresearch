# Pegasus Analyst AI

A VC startup research dashboard that turns a company name (or URL) into a
full first-pass investment memo — valuation, funding history, market
sizing, competitor landscape, and comps — in seconds.

## Stack

- React 19 + Vite
- Tailwind CSS v4
- Recharts (funding bar/line chart, market-sizing donut, competitor scatter)
- Lucide React (icons)
- Groq (Llama 3.3 70B) for live AI-generated memos, with automatic key
  rotation and a deterministic mock-data fallback

## Getting started

```bash
npm install
cp .env.example .env   # then fill in your Groq API key(s)
npm run dev
```

## AI generation

`src/services/groqService.js` calls the Groq chat completions API and asks
for a structured JSON memo matching the exact shape used throughout the UI.
Up to three API keys (`VITE_GROQ_API_KEY`, `_2`, `_3`) are tried in order,
so a single rate-limited key doesn't take the feature down.

If no keys are configured, or every key fails (rate limit, network error),
the app falls back to `src/data/mockStartups.js`:

- **Curated data** for a couple of well-known companies (Anthropic, Figure AI)
- **A deterministic generator** for any other name, so search always
  returns a result — clearly labeled as a directional/unverified estimate

Because both paths return identically-shaped objects, every component in
`src/components/` is agnostic to whether the data came from the live model
or the mock generator. Swapping in a real data provider (Crunchbase,
PitchBook, an internal CRM) later just means writing another function with
that same return shape.

## Project layout

```
src/
  components/   UI building blocks (charts, tables, sidebar, header)
  data/         Mock/generated startup data
  services/     Groq API integration
```

## Environment variables

See `.env.example`. Never commit `.env` — it's gitignored.
