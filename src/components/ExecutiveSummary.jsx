import { FileText } from 'lucide-react';

export default function ExecutiveSummary({ items }) {
  const bullets = (items ?? []).filter(Boolean);
  if (bullets.length === 0) return null;

  return (
    <div className="bg-panel border border-border rounded-[10px] p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <FileText size={15} className="text-accent-soft shrink-0" />
        <h3 className="text-[13px] font-semibold text-text">Executive Summary</h3>
      </div>
      <ul className="flex flex-col gap-2">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2 text-[13px] text-text-muted leading-relaxed">
            <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-1.5" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
