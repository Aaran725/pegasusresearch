import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { tooltipStyle, gridStroke } from './ChartTooltip';

const LABELS = {
  team: 'Team & Vision',
  techInnovation: 'Tech Innovation',
  financials: 'Financials',
  vcaasFit: 'VCaaS Fit',
};

export default function PegasusFitRadar({ fit }) {
  const entries = Object.entries(LABELS)
    .map(([key, label]) => ({ key, label, score: fit?.[key]?.score }))
    .filter((e) => typeof e.score === 'number');
  if (entries.length === 0) return null;

  const composite = Math.round(entries.reduce((sum, e) => sum + e.score, 0) / entries.length);
  const data = entries.map((e) => ({ criterion: e.label, score: e.score }));

  return (
    <div className="flex items-center gap-4">
      <div className="h-[200px] w-[200px] shrink-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="75%">
            <PolarGrid stroke={gridStroke} />
            <PolarAngleAxis dataKey="criterion" tick={{ fill: '#94A3B8', fontSize: 10 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Radar dataKey="score" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.35} strokeWidth={2} />
            <Tooltip {...tooltipStyle} formatter={(value) => [`${value}/100`, 'Score']} />
          </RadarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[9px] uppercase tracking-wider text-text-faint">Overall</span>
          <span className="text-2xl font-bold text-text font-mono">{composite}</span>
        </div>
      </div>
    </div>
  );
}
