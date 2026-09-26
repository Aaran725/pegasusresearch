import { Gavel } from 'lucide-react';

const VERDICT_STYLES = {
  Pursue: 'text-positive bg-positive/10 border-positive/25',
  Watch: 'text-warning bg-warning/10 border-warning/25',
  Pass: 'text-negative bg-negative/10 border-negative/25',
};

export default function InvestmentRecommendation({ recommendation }) {
  if (!recommendation?.verdict) return null;

  return (
    <div className="bg-panel border border-border rounded-[10px] p-4 flex items-start gap-3.5">
      <div
        className={`shrink-0 flex items-center gap-1.5 rounded-lg border px-3 py-2 ${
          VERDICT_STYLES[recommendation.verdict] ?? VERDICT_STYLES.Watch
        }`}
      >
        <Gavel size={14} />
        <span className="text-[13px] font-bold tracking-wide uppercase">{recommendation.verdict}</span>
      </div>
      {recommendation.rationale && (
        <p className="text-[12.5px] text-text-muted leading-relaxed pt-1.5">{recommendation.rationale}</p>
      )}
    </div>
  );
}
