import { LayoutGrid } from 'lucide-react';

const QUADRANTS = [
  { key: 'strengths', label: 'Strengths', style: 'border-positive/25 bg-positive/5', dot: 'bg-positive' },
  { key: 'weaknesses', label: 'Weaknesses', style: 'border-negative/25 bg-negative/5', dot: 'bg-negative' },
  { key: 'opportunities', label: 'Opportunities', style: 'border-accent/25 bg-accent/5', dot: 'bg-accent' },
  { key: 'threats', label: 'Threats', style: 'border-warning/25 bg-warning/5', dot: 'bg-warning' },
];

export default function SwotGrid({ swot }) {
  const quadrants = QUADRANTS.map((q) => ({ ...q, items: (swot?.[q.key] ?? []).filter(Boolean) }));
  const hasAny = quadrants.some((q) => q.items.length > 0);
  if (!hasAny) return null;

  return (
    <div className="bg-panel border border-border rounded-[10px] p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <LayoutGrid size={15} className="text-accent-soft shrink-0" />
        <h3 className="text-[13px] font-semibold text-text">SWOT Analysis</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {quadrants.map((q) => (
          <div key={q.key} className={`rounded-lg border p-3 flex flex-col gap-2 min-h-[80px] ${q.style}`}>
            <span className="text-[10.5px] font-semibold tracking-wider uppercase text-text-faint">{q.label}</span>
            {q.items.length === 0 ? (
              <span className="text-[11.5px] text-text-dim italic">Nothing evidence-backed found</span>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {q.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[12px] text-text-muted leading-relaxed">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1 ${q.dot}`} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
