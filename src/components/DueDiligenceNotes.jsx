import { Search } from 'lucide-react';

const FIELDS = [
  { key: 'businessModel', label: 'Business Model & Pricing' },
  { key: 'techDifferentiation', label: 'Tech / IP' },
  { key: 'teamScale', label: 'Team & Hiring' },
  { key: 'customers', label: 'Customers & Partnerships' },
  { key: 'productRoadmap', label: 'Product Roadmap' },
];

// Deep-only evidence (the 5 extra base clusters deep mode searches) has
// nowhere else to render — it's not part of the standard KPI cards. Only
// shown for deep-mode memos, and only if at least one field actually came
// back with something (deep mode's extra queries can still turn up nothing
// for a given company, same as any other search).
export default function DueDiligenceNotes({ data }) {
  const items = FIELDS.map((f) => ({ ...f, value: data?.[f.key] })).filter((f) => f.value);
  if (items.length === 0) return null;

  return (
    <div className="bg-panel border border-border rounded-[10px] p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Search size={15} className="text-accent-soft shrink-0" />
        <h3 className="text-[13px] font-semibold text-text">Due Diligence Notes</h3>
        <span className="text-[10px] tracking-wider uppercase text-text-faint ml-auto">deep research only</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((f) => (
          <div key={f.key} className="flex flex-col gap-0.5">
            <span className="text-[11px] font-medium text-text-faint">{f.label}</span>
            <p className="text-[12.5px] text-text-muted leading-relaxed">{f.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
