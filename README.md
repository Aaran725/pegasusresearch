# Pegasus Analyst AI

A VC startup research dashboard that turns a company name (or URL) into a
first-pass investment memo — valuation, funding history, market sizing,
competitor landscape, and comps — grounded in live web search, with every
number cited back to a source.

## Stack

- **Frontend:** React 19 + Vite, Tailwind CSS v4, Recharts, Lucide React
- **Backend:** Express (Node), holds all API keys server-side
- **Research pipeline:** Tavily (live web search) → Groq (evidence-grounded
  synthesis, cite-or-abstain) — chat model is auto-detected, not hardcoded
  (see below)

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
  The chat model isn't hardcoded — `server/services/groqClient.js` queries
  Groq's live `/models` list and picks a suitable one automatically (and
  re-picks if the one it's using ever gets deprecated mid-session, which
  Groq does periodically). Set `GROQ_MODEL` in `.env` to pin a specific
  model instead. `GET /api/health` reports whichever model is currently
  in use.
- **Tavily** (https://tavily.com) — free tier, 1,000 search credits/month.
  A **Standard** run costs up to 13 credits (~75 searches/month); a **Deep**
  run costs up to 36 (~27 searches/month) — see the depth toggle below.
  Usage is tracked server-side and shown live in the sidebar; the app
  refuses to start a run it can't afford rather than partially burning
  quota, and later rounds get skipped first if budget runs low mid-run.

## How research works

`server/services/researchOrchestrator.js` runs an ADAPTIVE, multi-round
pipeline per search — not one fixed query batch. A single fixed batch
means whatever it happens to miss just stays missing; each round below
exists because it's a mistake a fixed batch makes that a human researcher
(or a follow-up round) wouldn't:

1. **Base search** (Tavily) — funding/valuation, competitors, revenue/TAM,
   recent news, and a Crunchbase/PitchBook-targeted query (5 topics in
   Standard mode; Deep mode adds business model/pricing, tech/IP,
   team/hiring, customers/partnerships, and product roadmap — 10 total).
   These 5 Deep-only topics feed a dedicated "Due Diligence Notes" panel
   (`businessModel`/`techDifferentiation`/`teamScale`/`customers`/
   `productRoadmap` on the memo, shown only for Deep-mode results) — they
   used to be searched but had no output field to land in, so they never
   actually changed what a Deep-mode search showed.
2. **Follow-up depth pass** (budget-permitting):
   - A cheap Groq call reads the base evidence and names real competitors
     actually mentioned in it (never invented — up to 3 in Standard, up
     to 6 in Deep) — a dedicated Tavily query then researches each one
     individually (Deep mode runs a second query per competitor covering
     product/positioning, not just funding), so the comps table is
     sourced from evidence about that specific competitor, not stray
     mentions in the subject company's own search results.
   - A dedicated founder/CEO background query.
   - A dedicated risk query (`lawsuit OR layoffs OR controversy OR
     investigation OR regulatory`) — deliberately hunting for negative
     signals, since a naive pipeline only ever surfaces positives.
3. **Adaptive gap-filling** (budget-permitting, 1 round in Standard, up to
   3 in Deep): a cheap Groq call reviews everything gathered so far and
   checks each of valuation / funding / market size / revenue /
   competitors for whether there's actually clear supporting evidence yet
   (Deep mode's rounds also check the 5 due-diligence fields above, so its
   extra rounds have real gaps of their own to find instead of re-checking
   the same fields round 1 already resolved). For anything still thin, it
   writes one targeted follow-up query — not a repeat of the generic
   round-1 query, but a different angle (a specific source type, a
   specific event, alternate phrasing). Deep mode re-assesses after each
   round using everything gathered so far (including prior gap-fill
   rounds), stopping early the moment a round reports nothing left to
   fill.
4. **Map-reduce evidence compression** (`server/services/evidenceSummarizer.js`):
   Groq's free tier has a real, hard per-model token ceiling (as low as
   ~8,000 tokens/minute on some models — hit in production), independent
   of how many Tavily queries were fired. Firing more queries alone
   doesn't get more information into the final memo once that ceiling is
   full. Before the final synthesis call, any evidence group with more
   than ~1,500 characters of raw text gets a small, cheap Groq call that
   extracts a handful of concrete, URL-cited facts — far more
   information-dense than a raw 700-char snippet (often padding or a
   sentence cut off mid-thought). Small groups pass through unsummarized
   (no Groq call spent). This is what actually lets Deep mode's extra
   search translate into a richer memo instead of the fixed evidence
   budget just truncating it away — roughly 60 digest facts fit the same
   budget that ~14-17 raw snippets used to. Applies to both depths.
5. **Evidence-grounded synthesis** (Groq, one final call over the
   compressed digest) — cites every numeric claim to a specific source
   snippet, or returns `null`/omits the entry rather than guessing, and
   self-rates confidence per field (`verified` / `inferred` /
   `unavailable`).
6. The frontend renders sources, confidence badges, an expandable research
   trace, a risk-signals panel (including an explicit "searched and found
   nothing" state — that's a real, meaningful result, not an omission),
   a founding-team panel, and a recent-news timeline.

### Standard vs. Deep

A toggle next to the search bar picks the depth. Standard mode is today's
research volume (still benefiting from map-reduce compression — a real
quality improvement, not just a Deep-mode perk). Deep mode trades ~2.5x
more Tavily credits for ~2x topic breadth, ~2x competitor depth, and up to
3 gap-filling rounds instead of 1. Standard and Deep results for the same
company are **cached separately** (`server/services/researchCache.js`) —
switching modes always gets that mode's own result, never silently serves
the other mode's shallower/deeper data. The status pill and the
"Researched X ago" line both show which depth a displayed memo came from.

**Caching:** results are cached per company (`server/data-cache/`, file-based)
for 24h. A second search of the same company is instant and spends no
quota; the UI shows "Researched X ago" with a manual Refresh that bypasses
the cache. Past 24h, cached data still loads (flagged `stale`) rather than
silently forcing a re-run.

If Tavily/Groq are unreachable, misconfigured, quota-exhausted, or find
nothing for a given name, the app falls back to `src/data/mockStartups.js`
— curated data for a couple of well-known companies, or a deterministic
generator for anything else — clearly labeled as demo/directional data,
never presented as real research. The UI distinguishes exactly why it fell
back (search unreachable vs. no evidence found vs. quota exhausted vs.
synthesis failed) rather than showing one generic error.

**Honest limitation:** this gets you a cited first-pass draft from the
*public* web. It does not replace data-room access, reference calls, or
paid terminals (PitchBook/Crunchbase Pro) — nothing free-tier can. Market
sizing (TAM/SAM/SOM) in particular is almost always `inferred`, not
`verified` — real market-sizing breakdowns are rarely published anywhere
a free search API can find them.

## Making it a tool you'd actually use (Phase 5)

- **Export Memo** is real — a client-side PDF (jsPDF + autotable) with every
  section (metrics, verdict, funding, market sizing, comps, team, news,
  risk flags, sources) laid out for printing or sharing, not just a
  decorative button.
- **Edit the AI's draft.** The AI Verdict paragraph and the four top KPI
  values (valuation, funding, lead investors, TAM) are click-to-edit on
  live-researched companies. Edits persist server-side per company
  (`server/services/editsStore.js`) independently of the research cache —
  a later Refresh re-runs search without wiping out your corrections, and
  an edited field is visibly flagged `EDITED` rather than silently
  overwritten. This only applies to live research; there's nowhere to
  persist an edit to demo/mock data.
- **Portfolio is a real backend-persisted watchlist**
  (`server/services/portfolioStore.js`), not a placeholder. Add a company
  from its dashboard, see it in the Portfolio tab with a one-click "View"
  that reopens it (from cache — instant, no quota spent).
- **Market Trends is real, honestly scoped.** There's no external
  market-data feed wired in, so instead of faking one, `/api/trends`
  aggregates *your own research history* — sector/stage breakdown, average
  valuation per sector, recent activity — computed directly from the
  research cache. The view says exactly that, rather than presenting it as
  industry data it isn't.

**Deliberately not built:** multi-analyst auth (accounts, sessions, access
control). That's a materially different, larger scope than the rest of
Phase 5 — this is still a single-user/local tool, and bolting on a token
login without real multi-user data isolation would be worse than being
upfront that it isn't there yet.

## Project layout

```
server/
  index.js                          Express entry point (dev: API only; prod: API + static frontend)
  routes/research.js                POST /api/research, PATCH /api/research/edits, GET /api/quota
  routes/portfolio.js               GET/POST /api/portfolio, DELETE /api/portfolio/:name
  routes/trends.js                  GET /api/trends — aggregates from the research cache
  services/tavilyClient.js          Live web search + quota recording
  services/groqClient.js            Evidence-grounded LLM synthesis, model fallback chain, shared runJSONPrompt
  services/evidenceSummarizer.js    Map-reduce evidence compression (large groups -> dense cited facts)
  services/researchOrchestrator.js  Depth presets, wires search -> follow-ups -> gap-fill -> synthesis
  services/researchCache.js         24h file-based cache per company, keyed by depth
  services/quotaTracker.js          Monthly Tavily credit usage, persisted to disk
  services/editsStore.js            Analyst edits/overrides, merged onto memos at read time
  services/portfolioStore.js        Watchlist (single JSON file)

src/
  components/    UI building blocks (charts, tables, sidebar, header, risk/team/news panels,
                  EditableField, PortfolioView, TrendsView)
  data/          Mock/generated fallback startup data
  services/       researchService.js (backend calls), portfolioService.js, trendsService.js
  utils/exportMemo.js   Client-side PDF generation
```

## Environment variables

See `.env.example`. Never commit `.env` — it's gitignored.
