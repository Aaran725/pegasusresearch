import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Loader2 } from 'lucide-react';
import { tooltipStyle, axisTickStyle, gridStroke } from './ChartTooltip';
import { fetchTrends } from '../services/trendsService';

function relativeTime(ts) {
  const days = Math.floor((Date.now() - ts) / (24 * 60 * 60 * 1000));
  if (days < 1) return 'today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

export default function TrendsView() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrends()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-[13px] text-negative py-20">
        Could not load trends: {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2 size={20} className="text-accent-soft animate-spin" />
      </div>
    );
  }

  if (data.totalResearched === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center py-24 gap-3">
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-border flex items-center justify-center">
          <TrendingUp size={22} className="text-text-muted" />
        </div>
        <h2 className="text-[15px] font-semibold text-text">No research history yet</h2>
        <p className="text-[13px] text-text-muted max-w-sm">
          This view aggregates companies you've actually researched via live search — search a
          few companies from the Search tab to populate it.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <h2 className="text-[15px] font-semibold text-text">Market Trends</h2>
        <span className="text-[11px] text-text-faint">{data.note}</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-3.5">
        <div className="bg-panel border border-border rounded-[10px] p-4 flex flex-col gap-1 min-w-0">
          <h3 className="text-[13px] font-semibold text-text">Companies Researched by Sector</h3>
          <div className="h-[260px] mt-2 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.bySector} layout="vertical" margin={{ top: 8, right: 20, bottom: 0, left: 0 }}>
                <CartesianGrid stroke={gridStroke} horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={axisTickStyle} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="sector"
                  tick={axisTickStyle}
                  axisLine={false}
                  tickLine={false}
                  width={140}
                />
                <Tooltip
                  {...tooltipStyle}
                  formatter={(value, name, item) => [
                    `${value} researched${item.payload.avgValuation ? ` · avg valuation ${item.payload.avgValuation}` : ''}`,
                    'Count',
                  ]}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-panel border border-border rounded-[10px] p-4 flex flex-col gap-3">
          <h3 className="text-[13px] font-semibold text-text">By Stage</h3>
          <div className="flex flex-col gap-2">
            {data.byStage.map((s) => (
              <div key={s.stage} className="flex items-center justify-between text-[12.5px]">
                <span className="text-text-muted">{s.stage}</span>
                <span className="text-text font-mono">{s.count}</span>
              </div>
            ))}
          </div>
          <div className="pt-2 mt-auto border-t border-border-soft text-[11px] text-text-faint">
            {data.totalResearched} companies researched total
          </div>
        </div>
      </div>

      <div className="bg-panel border border-border rounded-[10px] overflow-hidden">
        <div className="px-4 py-3.5 border-b border-border">
          <h3 className="text-[13px] font-semibold text-text">Recent Research Activity</h3>
        </div>
        <div className="flex flex-col">
          {data.recent.map((r, i) => (
            <div
              key={r.name + i}
              className={`flex items-center justify-between gap-3 px-4 py-2.5 text-[12.5px] ${
                i % 2 === 1 ? 'bg-white/[0.015]' : ''
              }`}
            >
              <span className="text-text font-medium truncate">{r.name}</span>
              <span className="text-text-muted truncate">{r.sector}</span>
              <span className="text-text-muted whitespace-nowrap">{r.stage}</span>
              <span className="text-text font-mono whitespace-nowrap">{r.valuation ?? '—'}</span>
              <span className="text-text-faint whitespace-nowrap">{relativeTime(r.fetchedAt)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
