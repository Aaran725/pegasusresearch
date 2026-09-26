import { ExternalLink, ChevronDown } from 'lucide-react';
import EditableField from './EditableField';

const CONFIDENCE_STYLES = {
  verified: 'text-positive bg-positive/10 border-positive/25',
  inferred: 'text-warning bg-warning/10 border-warning/25',
  unavailable: 'text-text-faint bg-white/5 border-border',
};

const CONFIDENCE_LABELS = {
  valuation: 'Valuation',
  totalRaised: 'Funding',
  tam: 'Market size',
  competitors: 'Competitors',
  marketSizing: 'TAM/SAM/SOM',
};

function ConfidenceBadges({ confidence }) {
  const entries = Object.entries(confidence ?? {}).filter(([, v]) => v);
  if (entries.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {entries.map(([key, level]) => (
        <span
          key={key}
          title={`${CONFIDENCE_LABELS[key] ?? key}: ${level}`}
          className={`text-[9.5px] font-semibold tracking-wide uppercase rounded-md px-1.5 py-0.5 border whitespace-nowrap ${
            CONFIDENCE_STYLES[level] ?? CONFIDENCE_STYLES.unavailable
          }`}
        >
          {CONFIDENCE_LABELS[key] ?? key} · {level}
        </span>
      ))}
    </div>
  );
}

export default function AIVerdict({ data, source, onSaveField }) {
  const isLive = source === 'groq+tavily';
  const sources = data.sources ?? [];
  const trace = data.researchTrace ?? [];
  const verdictText = <p className="text-[13px] text-text-muted leading-relaxed">{data.aiVerdict}</p>;

  return (
    <div className="bg-panel border border-border border-l-2 border-l-accent-strong rounded-[10px] px-5 py-4 flex flex-col gap-3">
      <div>
        <div className="flex items-center gap-2.5 flex-wrap mb-2.5">
          <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-accent-soft bg-accent/10 border border-accent/25 rounded-md px-2 py-0.5">
            AI Verdict
          </span>
          <span className="text-[11px] text-text-faint">
            Pegasus thesis engine · {isLive ? 'live web-grounded research' : 'demo dataset'}
          </span>
        </div>
        {onSaveField ? (
          <EditableField
            value={data.aiVerdict}
            edited={data.editedFields?.includes('aiVerdict')}
            multiline
            onSave={(next) => onSaveField('aiVerdict', next)}
          >
            {verdictText}
          </EditableField>
        ) : (
          verdictText
        )}
      </div>

      {data.confidence && <ConfidenceBadges confidence={data.confidence} />}

      {sources.length > 0 && (
        <div className="pt-2 border-t border-border-soft flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold tracking-wider uppercase text-text-faint">
            Sources ({sources.length})
          </span>
          <div className="flex flex-col gap-1">
            {sources.map((s, i) => (
              <a
                key={s.url ?? i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-1.5 text-[11.5px] text-accent-lighter hover:text-accent-soft group"
              >
                <ExternalLink size={11} className="shrink-0 mt-0.5" />
                <span className="min-w-0">
                  <span className="group-hover:underline">{s.title || s.url}</span>
                  {s.usedFor && <span className="text-text-faint"> — {s.usedFor}</span>}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {trace.length > 0 && (
        <details className="pt-2 border-t border-border-soft group">
          <summary className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase text-text-faint cursor-pointer select-none list-none">
            <ChevronDown size={12} className="transition-transform group-open:rotate-180" />
            Research trace ({trace.length} {trace.length === 1 ? 'query' : 'queries'})
          </summary>
          <div className="mt-2 flex flex-col gap-1">
            {trace.map((t, i) => (
              <div key={i} className="text-[11.5px] text-text-muted flex items-center gap-2">
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    t.failed ? 'bg-negative' : t.resultCount > 0 ? 'bg-positive' : 'bg-text-dim'
                  }`}
                />
                <span className="truncate">"{t.query}"</span>
                <span className="text-text-faint shrink-0">
                  {t.failed ? 'failed' : `${t.resultCount} results`}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
