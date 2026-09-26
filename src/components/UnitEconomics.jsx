import { DollarSign } from 'lucide-react';

const FIELDS = [
  { key: 'grossMargin', label: 'Gross Margin' },
  { key: 'burnRate', label: 'Burn Rate' },
  { key: 'runway', label: 'Runway' },
  { key: 'cac', label: 'CAC' },
  { key: 'ltv', label: 'LTV' },
];

// Most private companies won't have most of these publicly disclosed —
// that's an honest, expected result, not a bug. Only renders if at least
// one field actually came back with something.
export default function UnitEconomics({ economics }) {
  const items = FIELDS.map((f) => ({ ...f, value: economics?.[f.key] }));
  const hasAny = items.some((f) => f.value);
  if (!hasAny) return null;

  return (
    <div className="bg-panel border border-border rounded-[10px] p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <DollarSign size={15} className="text-accent-soft shrink-0" />
        <h3 className="text-[13px] font-semibold text-text">Unit Economics</h3>
        <span className="text-[10px] tracking-wider uppercase text-text-faint ml-auto">
          where publicly disclosed
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {items.map((f) => (
          <div key={f.key} className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold tracking-wider uppercase text-text-faint">{f.label}</span>
            <span className={`text-[13px] font-mono font-semibold ${f.value ? 'text-text' : 'text-text-dim italic'}`}>
              {f.value ?? 'Not disclosed'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
