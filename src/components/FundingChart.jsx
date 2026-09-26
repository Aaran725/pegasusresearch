import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { tooltipStyle, axisTickStyle, gridStroke } from './ChartTooltip';
import NoDataNotice from './NoDataNotice';

function fmtB(v) {
  return v >= 1 ? `$${v.toFixed(1)}B` : `$${(v * 1000).toFixed(0)}M`;
}

export default function FundingChart({ data }) {
  const rounds = data ?? [];
  const totalRaised = rounds.reduce((sum, d) => sum + (d.raised ?? 0), 0);

  return (
    <div className="bg-panel border border-border rounded-[10px] p-4 flex flex-col gap-1 min-w-0">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <h3 className="text-[13px] font-semibold text-text">Funding History &amp; Valuation Over Time</h3>
        <span className="text-[10px] tracking-wider uppercase text-text-faint">
          {fmtB(totalRaised)} raised · {rounds.length} {rounds.length === 1 ? 'round' : 'rounds'}
        </span>
      </div>
      {rounds.length === 0 ? (
        <NoDataNotice label="funding history" />
      ) : (
      <div className="h-[260px] mt-1 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rounds} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={gridStroke} vertical={false} />
            <XAxis dataKey="round" tick={axisTickStyle} axisLine={{ stroke: gridStroke }} tickLine={false} />
            <YAxis
              yAxisId="raised"
              tick={axisTickStyle}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => fmtB(v)}
              width={52}
            />
            <YAxis
              yAxisId="valuation"
              orientation="right"
              tick={axisTickStyle}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => fmtB(v)}
              width={52}
            />
            <Tooltip
              {...tooltipStyle}
              formatter={(value, name) => [fmtB(value), name === 'raised' ? 'Raised' : 'Valuation']}
              labelFormatter={(label, payload) => `${label} · ${payload?.[0]?.payload?.year ?? ''}`}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, color: '#94A3B8' }}
              formatter={(value) => (value === 'raised' ? 'Raised per round' : 'Post-money valuation')}
            />
            <Bar yAxisId="raised" dataKey="raised" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={42} />
            <Line
              yAxisId="valuation"
              dataKey="valuation"
              type="monotone"
              stroke="#93C5FD"
              strokeWidth={2}
              dot={{ r: 3, fill: '#93C5FD', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      )}
    </div>
  );
}
