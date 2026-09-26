import { Search, Sparkles } from 'lucide-react';
import { SUGGESTED_SEARCHES } from '../data/mockStartups';

export default function EmptyState({ onPick }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center py-20 gap-4">
      <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/25 flex items-center justify-center">
        <Search size={22} className="text-accent-soft" />
      </div>
      <div>
        <h2 className="text-[15px] font-semibold text-text mb-1.5">The 2-Minute AI Analyst</h2>
        <p className="text-[13px] text-text-muted max-w-md">
          Type any startup name or URL above and Pegasus Analyst AI will generate a full
          investment memo — valuation, funding history, market sizing, competitor landscape and
          comps — in seconds.
        </p>
      </div>
      <div className="flex items-center gap-2 flex-wrap justify-center mt-1">
        <span className="text-[11px] text-text-faint flex items-center gap-1">
          <Sparkles size={12} /> Try:
        </span>
        {SUGGESTED_SEARCHES.map((name) => (
          <button
            key={name}
            onClick={() => onPick(name)}
            className="text-[12px] font-medium text-text-muted hover:text-text bg-white/5 hover:bg-white/10 border border-border rounded-md px-3 py-1.5 transition-colors"
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
