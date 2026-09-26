import { Search, Briefcase, TrendingUp, Settings, Zap } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'search', label: 'Search', icon: Search },
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
  { id: 'trends', label: 'Market Trends', icon: TrendingUp },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ active, onNavigate }) {
  return (
    <aside className="hidden md:flex w-[220px] shrink-0 flex-col border-r border-border bg-panel">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
        <div className="w-7 h-7 rounded-md bg-accent-strong flex items-center justify-center text-[13px] font-bold text-white shrink-0">
          P
        </div>
        <div className="flex flex-col leading-tight min-w-0">
          <span className="text-[13px] font-semibold text-text tracking-tight truncate">
            Pegasus Analyst AI
          </span>
          <span className="text-[10px] text-text-faint tracking-wider truncate">
            Deal Intelligence
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors text-left ${
                isActive
                  ? 'bg-accent/10 text-accent-soft border border-accent/25'
                  : 'text-text-muted hover:text-text hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon size={15} strokeWidth={2} />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/5 px-3 py-2.5">
          <Zap size={13} className="text-accent-soft shrink-0" />
          <span className="text-[11px] text-text-muted leading-snug">
            Pegasus Tech Ventures thesis engine active
          </span>
        </div>
      </div>
    </aside>
  );
}
