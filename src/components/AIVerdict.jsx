import EditableField from './EditableField';

// Sources, confidence badges, and the research trace moved to
// SourcesConfidence.jsx (its own dashboard section) — this component is
// now just the verdict paragraph + edit affordance.
export default function AIVerdict({ data, source, onSaveField }) {
  const isLive = source === 'groq+tavily';
  const verdictText = <p className="text-[13px] text-text-muted leading-relaxed">{data.aiVerdict}</p>;

  return (
    <div className="bg-panel border border-border border-l-2 border-l-accent-strong rounded-[10px] px-5 py-4 flex flex-col gap-3">
      <div className="flex items-center gap-2.5 flex-wrap">
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
  );
}
