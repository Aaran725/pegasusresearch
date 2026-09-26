import { Target } from 'lucide-react';

// Pegasus Tech Ventures explicitly rejects thematic/checklist investing —
// per Anis Uzzaman's own public statements, evaluation centers on founding
// team/market vision, management experience, technology innovation, and
// financial projections, plus whether a company fits the firm's actual
// differentiator: VCaaS, a network of 35+ corporate partners for
// manufacturing/distribution/global expansion. These four criteria are
// scored here instead of buried in aiVerdict prose, because that's the
// graded, sourced call an investment committee actually looks at.
const CRITERIA = [
  { key: 'team', label: 'Team & Market Vision' },
  { key: 'techInnovation', label: 'Technology Innovation' },
  { key: 'financials', label: 'Financial Trajectory' },
  { key: 'vcaasFit', label: 'VCaaS / Global-Expansion Fit' },
];

function scoreColor(score) {
  if (score >= 70) return 'bg-positive';
  if (score >= 40) return 'bg-warning';
  return 'bg-negative';
}

export default function PegasusFitCard({ fit }) {
  const items = CRITERIA.map((c) => ({ ...c, data: fit?.[c.key] })).filter((c) => c.data);
  if (items.length === 0) return null;

  return (
    <div className="bg-panel border border-border rounded-[10px] p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Target size={15} className="text-accent-soft shrink-0" />
        <h3 className="text-[13px] font-semibold text-text">Pegasus Fit</h3>
        <span className="text-[10px] tracking-wider uppercase text-text-faint ml-auto">
          scored against Pegasus Tech Ventures' actual criteria
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {items.map((c) => (
          <div key={c.key} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[11.5px] font-medium text-text">{c.label}</span>
              <span className="text-[13px] font-mono font-semibold text-text">{c.data.score}</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${scoreColor(c.data.score)}`}
                style={{ width: `${Math.max(0, Math.min(100, c.data.score))}%` }}
              />
            </div>
            {c.data.note && <p className="text-[12px] text-text-muted leading-relaxed">{c.data.note}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
