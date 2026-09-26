import { Newspaper, ExternalLink } from 'lucide-react';

const TYPE_STYLES = {
  funding: 'text-accent-soft bg-accent/10 border-accent/25',
  product: 'text-positive bg-positive/10 border-positive/25',
  leadership: 'text-warning bg-warning/10 border-warning/25',
  layoffs: 'text-negative bg-negative/10 border-negative/25',
  legal: 'text-negative bg-negative/10 border-negative/25',
  regulatory: 'text-negative bg-negative/10 border-negative/25',
  other: 'text-text-muted bg-white/5 border-border',
};

export default function NewsTimeline({ events }) {
  const items = events ?? [];
  if (items.length === 0) return null;

  return (
    <div className="bg-panel border border-border rounded-[10px] p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Newspaper size={15} className="text-accent-soft shrink-0" />
        <h3 className="text-[13px] font-semibold text-text">Recent Signals</h3>
        <span className="text-[10px] tracking-wider uppercase text-text-faint ml-auto">
          {items.length} sourced {items.length === 1 ? 'event' : 'events'}
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        {items.map((e, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span
              className={`text-[9.5px] font-bold tracking-wide uppercase rounded-md px-1.5 py-0.5 border shrink-0 mt-0.5 ${
                TYPE_STYLES[e.type] ?? TYPE_STYLES.other
              }`}
            >
              {e.type ?? 'other'}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                {e.date && <span className="text-[11px] text-text-faint font-mono">{e.date}</span>}
                <span className="text-[12.5px] text-text-muted leading-relaxed">{e.headline}</span>
              </div>
              {e.url && (
                <a
                  href={e.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-accent-lighter hover:text-accent-soft hover:underline mt-0.5"
                >
                  <ExternalLink size={10} />
                  source
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
