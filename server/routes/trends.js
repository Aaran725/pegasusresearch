import { Router } from 'express';
import { listAllCached } from '../services/researchCache.js';

const router = Router();

// Parses strings like "$183B", "$4.8B", "$620M" into a number of dollars.
// Returns null for anything not cleanly parseable (e.g. "N/A (Alphabet)")
// rather than guessing — this feeds averages, so a bad parse would silently
// skew them.
function parseMoney(str) {
  if (typeof str !== 'string') return null;
  const m = str.trim().match(/^\$?([\d.]+)\s*(T|B|M)?$/i);
  if (!m) return null;
  const value = parseFloat(m[1]);
  if (Number.isNaN(value)) return null;
  const mult = { T: 1e12, B: 1e9, M: 1e6 }[m[2]?.toUpperCase()] ?? 1;
  return value * mult;
}

function fmtMoney(n) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

router.get('/trends', (_req, res) => {
  const entries = listAllCached().filter((e) => e.memo);

  const sectorMap = new Map();
  const stageMap = new Map();
  const recent = [];

  for (const entry of entries) {
    const { memo, fetchedAt } = entry;
    const sector = memo.sector || 'Unspecified';
    const stage = memo.stage || 'Unspecified';
    const valuation = parseMoney(memo.valuation);

    if (!sectorMap.has(sector)) sectorMap.set(sector, { sector, count: 0, valuations: [] });
    const s = sectorMap.get(sector);
    s.count += 1;
    if (valuation) s.valuations.push(valuation);

    stageMap.set(stage, (stageMap.get(stage) ?? 0) + 1);

    recent.push({
      name: memo.name,
      sector,
      stage,
      valuation: memo.valuation ?? null,
      fetchedAt,
    });
  }

  const bySector = [...sectorMap.values()]
    .map((s) => ({
      sector: s.sector,
      count: s.count,
      avgValuation: s.valuations.length > 0 ? fmtMoney(s.valuations.reduce((a, b) => a + b, 0) / s.valuations.length) : null,
    }))
    .sort((a, b) => b.count - a.count);

  const byStage = [...stageMap.entries()]
    .map(([stage, count]) => ({ stage, count }))
    .sort((a, b) => b.count - a.count);

  recent.sort((a, b) => b.fetchedAt - a.fetchedAt);

  res.json({
    totalResearched: entries.length,
    bySector,
    byStage,
    recent: recent.slice(0, 20),
    note: 'Derived entirely from companies researched in this app — not external market data.',
  });
});

export default router;
