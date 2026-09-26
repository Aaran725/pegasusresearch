import { FileStack, Lightbulb, LineChart, Swords, Users, ShieldAlert, Link2 } from 'lucide-react';

const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: FileStack },
  { id: 'thesis', label: 'Investment Thesis', icon: Lightbulb },
  { id: 'financials', label: 'Financials & Market', icon: LineChart },
  { id: 'competitive', label: 'Competitive Landscape', icon: Swords },
  { id: 'diligence', label: 'Team & Diligence', icon: Users },
  { id: 'risk', label: 'Risk & Signals', icon: ShieldAlert },
  { id: 'sources', label: 'Sources & Methodology', icon: Link2 },
];

export default function DashboardTabs({ active, onChange }) {
  return (
    <div className="flex items-center gap-1 flex-wrap border-b border-border pb-0.5 overflow-x-auto">
      {SECTIONS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`flex items-center gap-1.5 text-[12px] font-medium px-3 py-2 border-b-2 whitespace-nowrap transition-colors ${
              isActive
                ? 'text-accent-soft border-accent'
                : 'text-text-muted border-transparent hover:text-text hover:border-white/15'
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
