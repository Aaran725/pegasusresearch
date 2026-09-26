import { ExternalLink, ChevronDown } from 'lucide-react';

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

function domainOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

// Promoted out of AIVerdict.jsx, which crammed sources/confidence/trace as
// small text at its bottom — genuinely important trust-building content
// (this is what proves the numbers are real, not hallucinated) that
// deserves real visual space in front of a rigorous investor, not a
// cramped link list.
export default function SourcesConfidence({ data }) {
  const sources = data.sources ?? [];
  const trace = data.researchTrace ?? [];
  const confidence = data.confidence ?? {};
  const confEntries = Object.entries(confidence).filter(([, v]) => v);

  if (sources.length === 0 && confEntries.length === 0 && trace.length === 0) return null;

  return (
    <div className="flex flex-col gap-3.5">
      {confEntries.length > 0 && (
        <div className="bg-panel border border-border rounded-[10px] p-4 flex flex-col gap-3">
          <h3 className="text-[13px] font-semibold text-text">Confidence Scorecard</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {confEntries.map(([key, level]) => (
              <div
                key={key}
                className={`flex flex-col gap-0.5 rounded-lg border px-2.5 py-2 ${
                  CONFIDENCE_STYLES[level] ?? CONFIDENCE_STYLES.unavailable
                }`}
              >
                <span className="text-[10px] font-semibold tracking-wider uppercase opacity-80">
                  {CONFIDENCE_LABELS[key] ?? key}
                </span>
                <span className="text-[12px] font-bold uppercase tracking-wide">{level}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {sources.length > 0 && (
        <div className="bg-panel border border-border rounded-[10px] p-4 flex flex-col gap-3">
          <div className="flex items-baseline gap-2">
            <h3 className="text-[13px] font-semibold text-text">Sources</h3>
            <span className="text-[10px] tracking-wider uppercase text-text-faint">{sources.length} cited</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {sources.map((s, i) => (
              <a
                key={s.url ?? i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 rounded-lg border border-border-soft bg-white/[0.02] hover:bg-white/[0.04] px-3 py-2.5 group min-w-0"
              >
                <ExternalLink size={12} className="text-accent-lighter shrink-0 mt-0.5" />
                <span className="min-w-0">
                  <span className="block text-[12px] text-text group-hover:text-accent-soft group-hover:underline truncate">
                    {s.title || domainOf(s.url)}
                  </span>
                  <span className="block text-[10.5px] text-text-faint truncate">{domainOf(s.url)}</span>
                  {s.usedFor && <span className="block text-[11px] text-text-muted mt-0.5">{s.usedFor}</span>}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {trace.length > 0 && (
        <div className="bg-panel border border-border rounded-[10px] p-4">
          <details className="group">
            <summary className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase text-text-faint cursor-pointer select-none list-none">
              <ChevronDown size={13} className="transition-transform group-open:rotate-180" />
              Research trace ({trace.length} {trace.length === 1 ? 'query' : 'queries'})
            </summary>
            <div className="mt-3 flex flex-col gap-1.5">
              {trace.map((t, i) => (
                <div key={i} className="text-[12px] text-text-muted flex items-center gap-2">
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
        </div>
      )}
    </div>
  );
}
