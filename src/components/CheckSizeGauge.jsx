import { Wallet } from 'lucide-react';

// Pegasus Tech Ventures' actual public check-size range: $100K-$10M,
// sweet spot ~$1M. fundingHistory's `raised` values are already extracted
// in $B (server/services/groqClient.js schema), so this is a pure derived
// visual — no extra query cost, and it's specific to how this firm
// actually writes checks rather than a generic VC-dashboard filler badge.
const MIN_USD = 100_000;
const MAX_USD = 10_000_000;

function fmtUsd(v) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function logPct(v) {
  const clamped = Math.min(Math.max(v, MIN_USD), MAX_USD);
  const pct = (Math.log10(clamped) - Math.log10(MIN_USD)) / (Math.log10(MAX_USD) - Math.log10(MIN_USD));
  return Math.round(pct * 100);
}

export default function CheckSizeGauge({ fundingHistory }) {
  const history = fundingHistory ?? [];
  const latest = history[history.length - 1];
  if (!latest || typeof latest.raised !== 'number') return null;

  const raisedUsd = latest.raised * 1_000_000_000;
  const inRange = raisedUsd >= MIN_USD && raisedUsd <= MAX_USD;
  const pct = logPct(raisedUsd);

  return (
    <div className="bg-panel border border-border rounded-[10px] p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Wallet size={15} className="text-accent-soft shrink-0" />
        <h3 className="text-[13px] font-semibold text-text">Check-Size Fit</h3>
        <span className="text-[10px] tracking-wider uppercase text-text-faint ml-auto">
          Pegasus range: {fmtUsd(MIN_USD)}–{fmtUsd(MAX_USD)}
        </span>
      </div>
      <div className="relative pt-5 pb-1">
        <div className="h-2 w-full rounded-full bg-gradient-to-r from-accent/20 via-accent/50 to-accent/20 border border-accent/25" />
        <div
          className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
          style={{ left: `${pct}%` }}
        >
          <span
            className={`text-[10px] font-mono font-semibold whitespace-nowrap mb-0.5 ${
              inRange ? 'text-positive' : 'text-warning'
            }`}
          >
            {fmtUsd(raisedUsd)}
          </span>
          <span className={`w-0.5 h-3 ${inRange ? 'bg-positive' : 'bg-warning'}`} />
        </div>
      </div>
      <p className="text-[11.5px] text-text-muted leading-relaxed">
        {inRange
          ? "Latest round size falls inside Pegasus's typical check range."
          : raisedUsd > MAX_USD
          ? "Latest round is above Pegasus's typical $10M check ceiling — a comps/awareness case, not a live-deal fit at this stage."
          : "Latest round is below Pegasus's typical $100K check floor."}
      </p>
    </div>
  );
}
