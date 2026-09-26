import { Shield } from 'lucide-react';

const STRENGTH_WIDTH = { high: '90%', medium: '55%', low: '25%' };
const STRENGTH_COLOR = { high: 'bg-positive', medium: 'bg-warning', low: 'bg-text-dim' };

export default function CompetitiveMoat({ moat }) {
  const items = (moat ?? []).filter((m) => m?.factor);
  if (items.length === 0) return null;

  return (
    <div className="bg-panel border border-border rounded-[10px] p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Shield size={15} className="text-accent-soft shrink-0" />
        <h3 className="text-[13px] font-semibold text-text">Competitive Moat</h3>
      </div>
      <div className="flex flex-col gap-3">
        {items.map((m, i) => (
          <div key={i} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[12px] font-medium text-text">{m.factor}</span>
              <span className="text-[10.5px] font-semibold uppercase tracking-wide text-text-faint">
                {m.strength}
              </span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${STRENGTH_COLOR[m.strength] ?? STRENGTH_COLOR.low}`}
                style={{ width: STRENGTH_WIDTH[m.strength] ?? STRENGTH_WIDTH.low }}
              />
            </div>
            {m.note && <p className="text-[12px] text-text-muted leading-relaxed">{m.note}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
