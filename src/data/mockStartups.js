// Mock investment-memo data, keyed by lowercase startup name.
//
// Shape is deliberately flat and serializable — this is exactly the JSON
// shape returned by src/services/groqService.js when the live LLM path is
// used, so swapping mock -> real API/Crunchbase data later is a no-op for
// every component that consumes it.

export const CURATED_STARTUPS = {
  anthropic: {
    name: 'Anthropic',
    ticker: 'ANTHROPIC',
    sector: 'Frontier AI / Foundation Models',
    stage: 'Series F',
    pitch:
      'Builds Claude, a family of frontier AI models, with safety research baked into the core product rather than bolted on after.',
    logoInitial: 'A',
    valuation: '$183B',
    valuationTrend: '+142%',
    totalRaised: '$27.1B',
    raisedTrend: '+38%',
    leadInvestors: 'Amazon, Google, ICONIQ',
    leadInvestorNote: 'Series F · Mar 2025',
    tam: '$1.3T',
    tamTrend: '+34%',
    aiVerdict:
      "Anthropic sits squarely inside Pegasus Tech Ventures' deep-tech thesis: defensible model IP, compounding data/compute moats, and genuine safety differentiation that increasingly matters for enterprise procurement. Revenue run-rate growth (>3x YoY) and multi-cloud backing from both Amazon and Google de-risk the capital intensity that sinks weaker foundation-model bets. Primary risk is compressing margins as inference costs scale faster than pricing power — worth underwriting on unit economics, not top-line growth, before committing follow-on capital.",
    fundingHistory: [
      { round: 'Seed', year: '2021', valuation: 1, raised: 0.124 },
      { round: 'Series A', year: '2021', valuation: 4.1, raised: 0.58 },
      { round: 'Series B', year: '2022', valuation: 20, raised: 2 },
      { round: 'Series C', year: '2023', valuation: 30, raised: 4.5 },
      { round: 'Series D', year: '2024', valuation: 61.5, raised: 4 },
      { round: 'Series E', year: '2024', valuation: 183, raised: 13 },
    ],
    marketSizing: [
      { name: 'TAM', label: 'Total Addressable Market', value: 1300000, color: '#3B82F6' },
      { name: 'SAM', label: 'Serviceable Addressable Market', value: 420000, color: '#60A5FA' },
      { name: 'SOM', label: 'Serviceable Obtainable Market', value: 38000, color: '#93C5FD' },
    ],
    competitors: [
      { name: 'Anthropic', innovation: 92, traction: 78, raised: 27100, subject: true },
      { name: 'OpenAI', innovation: 88, traction: 96, raised: 61900, subject: false },
      { name: 'Google DeepMind', innovation: 85, traction: 90, raised: 0, subject: false },
      { name: 'Mistral AI', innovation: 74, traction: 45, raised: 1400, subject: false },
    ],
    comps: [
      { name: 'Anthropic', valuation: '$183B', revenue: '$4.5B ARR', evRev: '40.7x', growth: '+220%', up: true, tier: 'Tier 1 Lead', tone: 'blue', differentiator: 'Constitutional AI safety layer; deep enterprise + AWS/GCP distribution' },
      { name: 'OpenAI', valuation: '$500B', revenue: '$13B ARR', evRev: '38.5x', growth: '+180%', up: true, tier: 'Incumbent', tone: 'slate', differentiator: 'Consumer scale via ChatGPT; Microsoft distribution + Azure compute' },
      { name: 'Google DeepMind', valuation: 'N/A (Alphabet)', revenue: 'Undisclosed', evRev: 'N/A', growth: '+95%', up: true, tier: 'Incumbent', tone: 'slate', differentiator: 'Owns TPU compute stack; Gemini bundled across Workspace/Android' },
      { name: 'Mistral AI', valuation: '$14B', revenue: '$150M ARR', evRev: '93.3x', growth: '+310%', up: true, tier: 'Fast Follower', tone: 'amber', differentiator: 'Open-weight models; strong EU sovereign-cloud positioning' },
    ],
  },

  'figure ai': {
    name: 'Figure AI',
    ticker: 'FIGURE',
    sector: 'Humanoid Robotics / Physical AI',
    stage: 'Series C',
    pitch:
      'Builds general-purpose humanoid robots for warehouse and manufacturing labor, pairing custom hardware with an in-house foundation model for embodied control.',
    logoInitial: 'F',
    valuation: '$39.5B',
    valuationTrend: '+371%',
    totalRaised: '$2.1B',
    raisedTrend: '+2500%',
    leadInvestors: 'Parkway VC, Nvidia, Microsoft',
    leadInvestorNote: 'Series C · Sep 2025',
    tam: '$170B',
    tamTrend: '+24%',
    aiVerdict:
      "Figure AI is a high-conviction physical-AI bet in line with Pegasus' thesis on deep tech with real-world deployment paths, not just model demos. The BMW manufacturing pilot and Helix foundation model give it a credible lead over pure hardware plays on the embodied-AI curve. The risk profile is materially different from software AI: unit economics depend on manufacturing yield and reliability at scale, which is unproven past pilot volumes. Underwrite this as a hardware company with an AI multiple, not an AI company that happens to have hardware — valuation already prices in flawless execution on manufacturing scale-up.",
    fundingHistory: [
      { round: 'Seed', year: '2022', valuation: 0.06, raised: 0.007 },
      { round: 'Series A', year: '2023', valuation: 0.6, raised: 0.07 },
      { round: 'Series B', year: '2024', valuation: 2.6, raised: 0.675 },
      { round: 'Series C', year: '2025', valuation: 39.5, raised: 1.0 },
    ],
    marketSizing: [
      { name: 'TAM', label: 'Total Addressable Market', value: 170000, color: '#3B82F6' },
      { name: 'SAM', label: 'Serviceable Addressable Market', value: 52000, color: '#60A5FA' },
      { name: 'SOM', label: 'Serviceable Obtainable Market', value: 6000, color: '#93C5FD' },
    ],
    competitors: [
      { name: 'Figure AI', innovation: 87, traction: 58, raised: 2100, subject: true },
      { name: 'Tesla Optimus', innovation: 80, traction: 62, raised: 0, subject: false },
      { name: 'Agility Robotics', innovation: 72, traction: 50, raised: 205, subject: false },
      { name: 'Apptronik', innovation: 68, traction: 40, raised: 403, subject: false },
    ],
    comps: [
      { name: 'Figure AI', valuation: '$39.5B', revenue: 'Pre-revenue (pilots)', evRev: 'N/A', growth: 'N/A', up: true, tier: 'Tier 1 Lead', tone: 'blue', differentiator: 'Helix embodied foundation model; BMW + logistics pilot deployments' },
      { name: 'Tesla Optimus', valuation: 'N/A (Tesla)', revenue: 'Pre-revenue', evRev: 'N/A', growth: 'N/A', up: true, tier: 'Incumbent', tone: 'slate', differentiator: 'Vertical manufacturing scale via Tesla Gigafactories; vision-only stack' },
      { name: 'Agility Robotics', valuation: '$1.75B', revenue: '$10M+ (est.)', evRev: '175x', growth: '+60%', up: true, tier: 'Fast Follower', tone: 'amber', differentiator: 'Digit robot in live Amazon/GXO warehouse deployment' },
      { name: 'Apptronik', valuation: '$2.7B', revenue: 'Pre-revenue (pilots)', evRev: 'N/A', growth: 'N/A', up: true, tier: 'Niche Player', tone: 'slate', differentiator: 'Apollo humanoid; Mercedes-Benz pilot; Google DeepMind model partnership' },
    ],
  },
};

const SECTORS = [
  'Deep Tech / Applied AI',
  'Physical AI / Robotics',
  'Enterprise SaaS Infrastructure',
  'Climate & Energy Tech',
  'Fintech Infrastructure',
  'Biotech / Computational Bio',
];

const STAGES = ['Seed', 'Series A', 'Series B', 'Series C'];
const TIERS = [
  { tier: 'Tier 1 Lead', tone: 'blue' },
  { tier: 'Fast Follower', tone: 'amber' },
  { tier: 'Incumbent', tone: 'slate' },
  { tier: 'Niche Player', tone: 'slate' },
];

// Deterministic string hash so the same query always renders the same
// "generated" numbers (rather than reshuffling on every keystroke/re-render).
function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function fmtMoney(millions) {
  if (millions >= 1000) return `$${(millions / 1000).toFixed(1)}B`;
  return `$${millions.toFixed(0)}M`;
}

// Generic generator used for any startup name that isn't curated above —
// keeps the "search anything" promise honest while the real LLM path
// (src/services/groqService.js) is unavailable or still loading.
export function generateMockStartup(query) {
  const name = query.trim();
  const seed = hashString(name.toLowerCase());
  const rand = seededRandom(seed);

  const sector = SECTORS[Math.floor(rand() * SECTORS.length)];
  const stageIdx = Math.floor(rand() * STAGES.length);
  const stage = STAGES[stageIdx];

  const baseValuation = 40 + rand() * 3500; // $40M - ~$3.5B
  const totalRaised = baseValuation * (0.12 + rand() * 0.18);
  const tam = 4 + rand() * 180; // $4B - $184B billions

  const fundingHistory = STAGES.slice(0, stageIdx + 1).map((round, i) => {
    const growth = Math.pow(baseValuation / 8, (i + 1) / (stageIdx + 1));
    return {
      round,
      year: String(2021 + i),
      valuation: Number((growth).toFixed(1)),
      raised: Number((growth * (0.15 + rand() * 0.1)).toFixed(2)),
    };
  });

  const competitorNames = ['Legacy Inc', 'Rival Labs', 'Nova Systems'];
  const competitors = [
    {
      name,
      innovation: Math.round(55 + rand() * 40),
      traction: Math.round(35 + rand() * 45),
      raised: Math.round(totalRaised),
      subject: true,
    },
    ...competitorNames.map((cName) => ({
      name: cName,
      innovation: Math.round(45 + rand() * 45),
      traction: Math.round(30 + rand() * 55),
      raised: Math.round(20 + rand() * totalRaised * 1.4),
      subject: false,
    })),
  ];

  const comps = [
    {
      name,
      valuation: fmtMoney(baseValuation),
      revenue: `${fmtMoney(baseValuation * (0.02 + rand() * 0.04))} ARR`,
      evRev: `${(18 + rand() * 25).toFixed(1)}x`,
      growth: `+${Math.round(60 + rand() * 200)}%`,
      up: true,
      tier: 'Tier 1 Lead',
      tone: 'blue',
      differentiator: `Subject company · ${sector.toLowerCase()} positioning under evaluation`,
    },
    ...competitorNames.map((cName, i) => {
      const t = TIERS[(i + 1) % TIERS.length];
      const up = rand() > 0.25;
      return {
        name: cName,
        valuation: fmtMoney(20 + rand() * baseValuation * 1.6),
        revenue: `${fmtMoney(5 + rand() * baseValuation * 0.05)} ARR`,
        evRev: `${(8 + rand() * 20).toFixed(1)}x`,
        growth: `${up ? '+' : '-'}${Math.round(rand() * 90)}%`,
        up,
        tier: t.tier,
        tone: t.tone,
        differentiator: 'Comparable positioning inferred from sector and stage — verify against primary sources.',
      };
    }),
  ];

  return {
    name,
    ticker: name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12) || 'STARTUP',
    sector,
    stage,
    pitch: `An early-stage ${sector.toLowerCase()} company; no curated primary-source profile on file yet — figures below are directional estimates, not verified data.`,
    logoInitial: name.trim()[0]?.toUpperCase() || '?',
    valuation: fmtMoney(baseValuation),
    valuationTrend: `+${Math.round(15 + rand() * 120)}%`,
    totalRaised: fmtMoney(totalRaised),
    raisedTrend: `+${Math.round(10 + rand() * 80)}%`,
    leadInvestors: 'Undisclosed — verify via Crunchbase/PitchBook',
    leadInvestorNote: `${stage} · estimated`,
    tam: fmtMoney(tam * 1000),
    tamTrend: `+${Math.round(5 + rand() * 30)}%`,
    aiVerdict:
      `No verified primary-source data exists yet for "${name}". This is a directional placeholder generated for demo purposes — plug in Crunchbase/PitchBook or the Groq LLM path (see src/services/groqService.js) for a real underwriting view. Structurally, a ${stage.toLowerCase()}-stage company in ${sector.toLowerCase()} would be evaluated against Pegasus' deep-tech and physical-AI thesis on: (1) defensibility of the core technology, (2) evidence of real deployment vs. pilots, and (3) capital efficiency relative to sector peers.`,
    fundingHistory,
    marketSizing: [
      { name: 'TAM', label: 'Total Addressable Market', value: Number((tam * 1000).toFixed(0)), color: '#3B82F6' },
      { name: 'SAM', label: 'Serviceable Addressable Market', value: Number((tam * 1000 * 0.3).toFixed(0)), color: '#60A5FA' },
      { name: 'SOM', label: 'Serviceable Obtainable Market', value: Number((tam * 1000 * 0.05).toFixed(0)), color: '#93C5FD' },
    ],
    competitors,
    comps,
    isGenerated: true,
  };
}

export function getStartupData(query) {
  const key = query.trim().toLowerCase();
  if (CURATED_STARTUPS[key]) {
    return { ...CURATED_STARTUPS[key], isGenerated: false };
  }
  return generateMockStartup(query);
}

export const SUGGESTED_SEARCHES = ['Anthropic', 'Figure AI'];
