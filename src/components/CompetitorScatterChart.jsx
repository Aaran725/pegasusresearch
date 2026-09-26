import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { tooltipStyle, axisTickStyle, gridStroke } from './ChartTooltip';

export default function CompetitorScatterChart({ data }) {
  const subject = data.filter((d) => d.subject);
  const others = data.filter((d) => !d.subject);

  return (
    <div className="bg-panel border border-border rounded-[10px] p-4 flex flex-col gap-1 min-w-0">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <h3 className="text-[13px] font-semibold text-text">Competitor Landscape</h3>
        <span className="text-[10px] tracking-wider uppercase text-text-faint">Innovation × Market Traction</span>
      </div>
      <div className="h-[260px] mt-1 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 20, bottom: 4, left: 0 }}>
            <CartesianGrid stroke={gridStroke} />
            <XAxis
              type="number"
              dataKey="traction"
              name="Market Traction"
              domain={[0, 100]}
              tick={axisTickStyle}
              axisLine={{ stroke: gridStroke }}
              tickLine={false}
              label={{ value: 'Market Traction →', position: 'insideBottom', offset: -4, fill: '#64748B', fontSize: 11 }}
            />
            <YAxis
              type="number"
              dataKey="innovation"
              name="Innovation"
              domain={[0, 100]}
              tick={axisTickStyle}
              axisLine={false}
              tickLine={false}
              width={36}
              label={{ value: 'Innovation →', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 11 }}
            />
            <ZAxis type="number" dataKey="raised" range={[80, 500]} name="Raised ($M)" />
            <Tooltip
              {...tooltipStyle}
              cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.2)' }}
              formatter={(value, name) => {
                if (name === 'Raised ($M)') return [`$${value}M`, 'Capital raised'];
                return [value, name];
              }}
              labelFormatter={() => ''}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload;
                return (
                  <div
                    style={tooltipStyle.contentStyle}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{p.name}</div>
                    <div style={{ color: '#94A3B8' }}>Innovation: {p.innovation}</div>
                    <div style={{ color: '#94A3B8' }}>Traction: {p.traction}</div>
                    <div style={{ color: '#94A3B8' }}>Raised: ${p.raised}M</div>
                  </div>
                );
              }}
            />
            <Scatter name="Comparables" data={others} fill="rgba(148,163,184,0.55)" />
            <Scatter name="Subject company" data={subject} fill="#3B82F6" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-4 flex-wrap pt-1">
        <span className="flex items-center gap-1.5 text-[11px] text-text-muted">
          <span className="w-2 h-2 rounded-sm bg-accent" />
          {subject[0]?.name ?? 'Subject'} (subject)
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-text-muted">
          <span className="w-2 h-2 rounded-sm bg-white/30" />
          Comparables · bubble size = capital raised
        </span>
      </div>
    </div>
  );
}
