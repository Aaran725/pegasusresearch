function MetricCard({ label, value, trend, trendPositive, sub, isText }) {
  return (
    <div className="bg-panel border border-border rounded-[10px] px-4 py-3.5 flex flex-col gap-2 min-w-0">
      <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-text-muted truncate">
        {label}
      </div>
      <div className="flex items-baseline justify-between gap-2 min-w-0">
        <span
          title={isText ? value : undefined}
          className={`font-semibold text-text tracking-tight leading-tight truncate ${
            isText ? 'text-[15px]' : 'text-[22px] sm:text-2xl font-mono'
          }`}
        >
          {value}
        </span>
      </div>
      <div className="flex items-center gap-1.5 min-w-0">
        {trend && (
          <span
            className={`text-[11px] font-semibold font-mono shrink-0 ${
              trendPositive ? 'text-positive' : 'text-accent-soft'
            }`}
          >
            {trend}
          </span>
        )}
        <span className="text-[11px] text-text-faint truncate">{sub}</span>
      </div>
    </div>
  );
}

export default function MetricsBar({ data }) {
  const metrics = [
    {
      label: 'Estimated Valuation',
      value: data.valuation,
      trend: data.valuationTrend,
      trendPositive: true,
      sub: 'vs. peers',
    },
    {
      label: 'Total Funding Raised',
      value: data.totalRaised,
      trend: data.raisedTrend,
      trendPositive: true,
      sub: 'since inception',
    },
    {
      label: 'Lead Investors',
      value: data.leadInvestors,
      trend: null,
      sub: data.leadInvestorNote,
      isText: true,
    },
    {
      label: 'Target Market (TAM)',
      value: data.tam,
      trend: data.tamTrend,
      trendPositive: true,
      sub: 'CAGR',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {metrics.map((m) => (
        <MetricCard key={m.label} {...m} />
      ))}
    </div>
  );
}
