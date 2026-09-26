import { TrendingUp, TrendingDown } from 'lucide-react';

export default function MarketTrends({ trends }) {
  const tailwinds = (trends?.tailwinds ?? []).filter(Boolean);
  const headwinds = (trends?.headwinds ?? []).filter(Boolean);
  if (tailwinds.length === 0 && headwinds.length === 0) return null;

  return (
    <div className="bg-panel border border-border rounded-[10px] p-4 flex flex-col gap-3">
      <h3 className="text-[13px] font-semibold text-text">Market Trends</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-positive">
            <TrendingUp size={12} /> Tailwinds
          </span>
          {tailwinds.length === 0 ? (
            <span className="text-[11.5px] text-text-dim italic">None evidence-backed</span>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {tailwinds.map((t, i) => (
                <li key={i} className="text-[12px] text-text-muted leading-relaxed">
                  {t}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-negative">
            <TrendingDown size={12} /> Headwinds
          </span>
          {headwinds.length === 0 ? (
            <span className="text-[11.5px] text-text-dim italic">None evidence-backed</span>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {headwinds.map((t, i) => (
                <li key={i} className="text-[12px] text-text-muted leading-relaxed">
                  {t}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
