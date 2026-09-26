import { DoorOpen } from 'lucide-react';

export default function ExitLandscape({ exits }) {
  const items = (exits ?? []).filter((e) => e?.company);
  if (items.length === 0) return null;

  return (
    <div className="bg-panel border border-border rounded-[10px] p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <DoorOpen size={15} className="text-accent-soft shrink-0" />
        <h3 className="text-[13px] font-semibold text-text">Exit Landscape</h3>
        <span className="text-[10px] tracking-wider uppercase text-text-faint ml-auto">comparable outcomes</span>
      </div>
      <div className="flex flex-col gap-2.5">
        {items.map((e, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-accent-soft bg-accent/10 border border-accent/25 rounded-md px-1.5 py-0.5 shrink-0 mt-0.5 whitespace-nowrap">
              {e.outcome}
            </span>
            <div className="min-w-0">
              <span className="text-[12.5px] font-medium text-text">{e.company}</span>
              {e.note && <p className="text-[12px] text-text-muted leading-relaxed">{e.note}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
