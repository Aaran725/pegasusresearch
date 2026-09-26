import { ShieldAlert, ShieldCheck, ExternalLink } from 'lucide-react';

const SEVERITY_STYLES = {
  high: 'text-negative bg-negative/10 border-negative/25',
  medium: 'text-warning bg-warning/10 border-warning/25',
  low: 'text-text-muted bg-white/5 border-border',
};

// Only rendered when a live risk-signal search actually ran (source ===
// 'groq+tavily') — an empty array here is a real, meaningful "checked and
// found nothing", not just an omitted field, so it gets its own reassuring
// empty state rather than disappearing silently.
export default function RiskFlags({ flags }) {
  const items = flags ?? [];

  return (
    <div className="bg-panel border border-border rounded-[10px] p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {items.length === 0 ? (
          <ShieldCheck size={15} className="text-positive shrink-0" />
        ) : (
          <ShieldAlert size={15} className="text-negative shrink-0" />
        )}
        <h3 className="text-[13px] font-semibold text-text">Risk Signals</h3>
        <span className="text-[10px] tracking-wider uppercase text-text-faint ml-auto">
          dedicated red-flag search
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-[12.5px] text-text-muted leading-relaxed">
          A dedicated search for lawsuits, layoffs, controversies, and regulatory action found
          nothing negative. Absence of evidence isn't proof of absence — this only reflects what's
          publicly indexed.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((f, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span
                className={`text-[9.5px] font-bold tracking-wide uppercase rounded-md px-1.5 py-0.5 border shrink-0 mt-0.5 ${
                  SEVERITY_STYLES[f.severity] ?? SEVERITY_STYLES.low
                }`}
              >
                {f.severity ?? 'low'}
              </span>
              <div className="min-w-0">
                <p className="text-[12.5px] text-text-muted leading-relaxed">{f.description}</p>
                {f.url && (
                  <a
                    href={f.url}
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
      )}
    </div>
  );
}
