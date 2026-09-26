import { Workflow } from 'lucide-react';

// Built entirely from data already computed by the pipeline (researchTrace,
// depth) — zero LLM involvement, zero hallucination risk. It's just an
// accurate description of the real pipeline that just ran, which is a
// genuinely strong trust signal in front of a technical audience: showing
// the mechanism, not only the output.
function categorize(trace) {
  const counts = { base: 0, competitor: 0, founder: 0, risk: 0, gapFill: 0, other: 0 };
  for (const t of trace) {
    const label = t.label ?? '';
    if (label.startsWith('BASE')) counts.base++;
    else if (label.startsWith('COMPETITOR:')) counts.competitor++;
    else if (label === 'FOUNDER BACKGROUND') counts.founder++;
    else if (label === 'RISK SIGNALS') counts.risk++;
    else if (label.startsWith('GAP FILL')) counts.gapFill++;
    else counts.other++;
  }
  return counts;
}

const STEPS = [
  { key: 'base', label: 'Base topic searches' },
  { key: 'competitor', label: 'Per-competitor deep-dives' },
  { key: 'founder', label: 'Founder background search' },
  { key: 'risk', label: 'Dedicated risk/red-flag search' },
  { key: 'gapFill', label: 'Adaptive gap-fill queries' },
];

export default function ResearchMethodology({ trace, depth }) {
  const items = trace ?? [];
  if (items.length === 0) return null;

  const counts = categorize(items);
  const failed = items.filter((t) => t.failed).length;
  const totalResults = items.reduce((sum, t) => sum + (t.resultCount ?? 0), 0);

  return (
    <div className="bg-panel border border-border rounded-[10px] p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Workflow size={15} className="text-accent-soft shrink-0" />
        <h3 className="text-[13px] font-semibold text-text">Research Methodology</h3>
        <span className="text-[10px] tracking-wider uppercase text-text-faint ml-auto">
          {depth ?? 'standard'} depth
        </span>
      </div>
      <p className="text-[12px] text-text-muted leading-relaxed">
        This memo ran {items.length} live web searches across {STEPS.filter((s) => counts[s.key] > 0).length}{' '}
        stages, returning {totalResults} total results{failed > 0 ? ` (${failed} query failed)` : ''}. Large
        result groups were compressed into dense, cited facts (map-reduce) before the final synthesis call, so
        more sources survive into the memo than raw snippets alone would allow.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {STEPS.filter((s) => counts[s.key] > 0).map((s) => (
          <div key={s.key} className="flex flex-col gap-0.5 rounded-lg border border-border-soft bg-white/[0.02] px-2.5 py-2">
            <span className="text-[15px] font-mono font-semibold text-text">{counts[s.key]}</span>
            <span className="text-[10.5px] text-text-faint leading-tight">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
