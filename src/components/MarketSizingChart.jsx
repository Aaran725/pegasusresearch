import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { tooltipStyle } from './ChartTooltip';

function fmtValue(v) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}T`;
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}B`;
  return `$${v.toFixed(0)}M`;
}

export default function MarketSizingChart({ data }) {
  const tam = data.find((d) => d.name === 'TAM')?.value ?? 0;

  return (
    <div className="bg-panel border border-border rounded-[10px] p-4 flex flex-col gap-1 min-w-0">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <h3 className="text-[13px] font-semibold text-text">Market Sizing</h3>
        <span className="text-[10px] tracking-wider uppercase text-text-faint">TAM · SAM · SOM</span>
      </div>
      <div className="relative h-[260px] mt-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={62}
              outerRadius={92}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              {...tooltipStyle}
              formatter={(value, _name, item) => [fmtValue(value), item?.payload?.label]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] uppercase tracking-wider text-text-faint">Total TAM</span>
          <span className="text-lg font-semibold text-text font-mono">{fmtValue(tam)}</span>
        </div>
      </div>
      <div className="flex items-center justify-center gap-4 flex-wrap pt-1">
        {data.map((d) => (
          <span key={d.name} className="flex items-center gap-1.5 text-[11px] text-text-muted">
            <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: d.color }} />
            {d.name} · {fmtValue(d.value)}
          </span>
        ))}
      </div>
    </div>
  );
}
