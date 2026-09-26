import EditableField from './EditableField';

// Pegasus Tech Ventures' actual public check-size range is $100K-$10M
// ($0.0001B-$0.01B), sweet spot ~$1M. fundingHistory's `raised` values are
// already extracted in $B, so this is a pure derived signal — no extra
// query cost, and it's specific to how this firm actually writes checks
// rather than generic VC-dashboard filler.
const PEGASUS_MIN_CHECK_B = 0.0001;
const PEGASUS_MAX_CHECK_B = 0.01;

function checkSizeFitBadge(fundingHistory) {
  if (!fundingHistory || fundingHistory.length === 0) return null;
  const latest = fundingHistory[fundingHistory.length - 1];
  if (typeof latest.raised !== 'number') return null;
  if (latest.raised >= PEGASUS_MIN_CHECK_B && latest.raised <= PEGASUS_MAX_CHECK_B) {
    return { text: `Latest round in Pegasus's $100K–$10M range`, positive: true };
  }
  if (latest.raised > PEGASUS_MAX_CHECK_B) {
    return { text: `Latest round above Pegasus's typical $10M check ceiling`, positive: false };
  }
  return null;
}

function MetricCard({ label, value, trend, sub, badge, isText, field, editedFields, onSaveField }) {
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
      {badge && (
        <span
          className={`text-[10px] leading-snug ${badge.positive ? 'text-positive' : 'text-warning'}`}
        >
          {badge.text}
        </span>
      )}
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
      badge: checkSizeFitBadge(data.fundingHistory),
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
