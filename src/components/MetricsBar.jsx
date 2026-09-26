import EditableField from './EditableField';

function MetricCard({ label, value, trend, sub, isText, field, editedFields, onSaveField }) {
  const hasValue = value !== null && value !== undefined && value !== '';
  const trendIsNegative = typeof trend === 'string' && trend.trim().startsWith('-');
  const editable = field && onSaveField;

  const valueEl = (
    <span
      title={isText && hasValue ? value : undefined}
      className={`font-semibold tracking-tight leading-tight truncate ${
        hasValue ? 'text-text' : 'text-text-dim italic'
      } ${isText ? 'text-[15px]' : 'text-[22px] sm:text-2xl font-mono'}`}
    >
      {hasValue ? value : 'Not found'}
    </span>
  );

  return (
    <div className="bg-panel border border-border rounded-[10px] px-4 py-3.5 flex flex-col gap-2 min-w-0">
      <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-text-muted truncate">
        {label}
      </div>
      <div className="flex items-baseline justify-between gap-2 min-w-0">
        {editable ? (
          <EditableField
            value={value ?? ''}
            edited={editedFields?.includes(field)}
            onSave={(next) => onSaveField(field, next)}
          >
            {valueEl}
          </EditableField>
        ) : (
          valueEl
        )}
      </div>
      <div className="flex items-center gap-1.5 min-w-0">
        {trend && (
          <span
            className={`text-[11px] font-semibold font-mono shrink-0 ${
              trendIsNegative ? 'text-negative' : 'text-positive'
            }`}
          >
            {trend}
          </span>
        )}
        {sub && <span className="text-[11px] text-text-faint truncate">{sub}</span>}
      </div>
    </div>
  );
}

export default function MetricsBar({ data, editable, onSaveField }) {
  const metrics = [
    {
      label: 'Estimated Valuation',
      value: data.valuation,
      trend: data.valuationTrend,
      sub: 'vs. peers',
      field: 'valuation',
    },
    {
      label: 'Total Funding Raised',
      value: data.totalRaised,
      trend: data.raisedTrend,
      sub: 'since inception',
      field: 'totalRaised',
    },
    {
      label: 'Lead Investors',
      value: data.leadInvestors,
      trend: null,
      sub: data.leadInvestorNote,
      isText: true,
      field: 'leadInvestors',
    },
    {
      label: 'Target Market (TAM)',
      value: data.tam,
      trend: data.tamTrend,
      sub: 'CAGR',
      field: 'tam',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {metrics.map((m) => (
        <MetricCard
          key={m.label}
          {...m}
          editedFields={data.editedFields}
          onSaveField={editable ? onSaveField : null}
        />
      ))}
    </div>
  );
}
