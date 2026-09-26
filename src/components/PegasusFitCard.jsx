import { Target } from 'lucide-react';
import PegasusFitRadar from './PegasusFitRadar';

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
      <div className="flex flex-col lg:flex-row items-center gap-4">
        <PegasusFitRadar fit={fit} />
        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 w-full">
          {items.map((c) => (
            <div key={c.key} className="flex flex-col gap-0.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[11.5px] font-medium text-text">{c.label}</span>
                <span className="text-[12px] font-mono font-semibold text-text-muted">{c.data.score}</span>
              </div>
              {c.data.note && <p className="text-[12px] text-text-muted leading-relaxed">{c.data.note}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
