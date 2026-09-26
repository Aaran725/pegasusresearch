import { Building2 } from 'lucide-react';

const FIELDS = [
  { key: 'founded', label: 'Founded' },
  { key: 'hq', label: 'Headquarters' },
  { key: 'employees', label: 'Employees' },
  { key: 'website', label: 'Website' },
];

export default function DealSnapshot({ snapshot }) {
  const items = FIELDS.map((f) => ({ ...f, value: snapshot?.[f.key] })).filter((f) => f.value);
  if (items.length === 0) return null;

  return (
    <div className="bg-panel border border-border rounded-[10px] px-4 py-3 flex items-center gap-2 flex-wrap">
      <Building2 size={14} className="text-text-faint shrink-0" />
      {items.map((f, i) => (
        <span key={f.key} className="flex items-center gap-1.5 text-[12px]">
          <span className="text-text-faint">{f.label}:</span>
          <span className="text-text-muted font-medium">{f.value}</span>
          {i < items.length - 1 && <span className="text-border ml-1.5">·</span>}
        </span>
      ))}
    </div>
  );
}
