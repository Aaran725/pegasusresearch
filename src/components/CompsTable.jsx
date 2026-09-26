import { useState } from 'react';

const TONE_STYLES = {
  blue: 'text-accent-soft bg-accent/10 border-accent/25',
  amber: 'text-warning bg-warning/10 border-warning/25',
  slate: 'text-text-muted bg-white/5 border-border',
};

const COLUMNS = [
  { key: 'name', label: 'Company', align: 'left' },
  { key: 'valuation', label: 'Valuation', align: 'right' },
  { key: 'revenue', label: 'Revenue Est.', align: 'right' },
  { key: 'evRev', label: 'EV / Rev', align: 'right' },
  { key: 'growth', label: 'Growth', align: 'right' },
  { key: 'tier', label: 'Tier', align: 'left' },
];

export default function CompsTable({ data }) {
  const [hoverRow, setHoverRow] = useState(-1);

  return (
    <div className="bg-panel border border-border rounded-[10px] overflow-hidden">
      <div className="flex items-baseline justify-between gap-2 flex-wrap px-4 py-3.5 border-b border-border">
        <h3 className="text-[13px] font-semibold text-text">Comparable Companies (Comps)</h3>
        <span className="text-[10px] tracking-wider uppercase text-text-faint">
          {data.length} companies · EV / Revenue basis
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[640px]">
          <thead>
            <tr className="bg-panel-alt">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-2.5 text-[10px] font-semibold tracking-[0.12em] uppercase text-text-muted border-b border-border ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-2.5 text-[10px] font-semibold tracking-[0.12em] uppercase text-text-muted border-b border-border text-left">
                Key Differentiator
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((c, i) => {
              const hovered = hoverRow === i;
              const rowBg = c.subject
                ? 'bg-accent/5'
                : i % 2 === 1
                ? 'bg-white/[0.015]'
                : 'bg-transparent';
              return (
                <tr
                  key={c.name}
                  onMouseEnter={() => setHoverRow(i)}
                  onMouseLeave={() => setHoverRow(-1)}
                  className={`transition-colors ${hovered ? 'bg-white/[0.03]' : rowBg}`}
                >
                  <td className="px-4 py-2.5 border-b border-border-soft">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          c.subject ? 'bg-accent' : 'bg-white/30'
                        }`}
                      />
                      <span className="text-[13px] font-medium text-text whitespace-nowrap">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right text-[13px] text-text/90 font-mono border-b border-border-soft whitespace-nowrap">
                    {c.valuation}
                  </td>
                  <td className="px-4 py-2.5 text-right text-[13px] text-text-muted font-mono border-b border-border-soft whitespace-nowrap">
                    {c.revenue}
                  </td>
                  <td className="px-4 py-2.5 text-right text-[13px] text-text/90 font-mono border-b border-border-soft whitespace-nowrap">
                    {c.evRev}
                  </td>
                  <td
                    className={`px-4 py-2.5 text-right text-[13px] font-mono border-b border-border-soft whitespace-nowrap ${
                      c.up ? 'text-positive' : 'text-negative'
                    }`}
                  >
                    {c.growth}
                  </td>
                  <td className="px-4 py-2.5 border-b border-border-soft">
                    <span
                      className={`text-[10px] font-semibold tracking-wide rounded-md px-2 py-0.5 border whitespace-nowrap ${TONE_STYLES[c.tone] ?? TONE_STYLES.slate}`}
                    >
                      {c.tier}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[12.5px] text-text-muted leading-snug border-b border-border-soft max-w-[320px]">
                    {c.differentiator}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
