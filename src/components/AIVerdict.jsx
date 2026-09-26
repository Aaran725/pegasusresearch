export default function AIVerdict({ data, source }) {
  return (
    <div className="bg-panel border border-border border-l-2 border-l-accent-strong rounded-[10px] px-5 py-4">
      <div className="flex items-center gap-2.5 flex-wrap mb-2.5">
        <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-accent-soft bg-accent/10 border border-accent/25 rounded-md px-2 py-0.5">
          AI Verdict
        </span>
        <span className="text-[11px] text-text-faint">
          Pegasus thesis engine · {source === 'groq' ? 'live model analysis' : 'demo dataset'} ·{' '}
          {data.isGenerated ? 'low confidence' : 'high confidence'}
        </span>
      </div>
      <p className="text-[13px] text-text-muted leading-relaxed">{data.aiVerdict}</p>
    </div>
  );
}
