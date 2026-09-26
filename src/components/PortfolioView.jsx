import { useEffect, useState } from 'react';
import { Briefcase, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { fetchPortfolio, removeFromPortfolio } from '../services/portfolioService';

function relativeTime(ts) {
  const days = Math.floor((Date.now() - ts) / (24 * 60 * 60 * 1000));
  if (days < 1) return 'today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

export default function PortfolioView({ onView, refreshKey }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPortfolio()
      .then(setItems)
      .catch((e) => setError(e.message));
  }, [refreshKey]);

  const handleRemove = async (name) => {
    try {
      const updated = await removeFromPortfolio(name);
      setItems(updated);
    } catch (e) {
      setError(e.message);
    }
  };

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-[13px] text-negative py-20">
        Could not load portfolio: {error}
      </div>
    );
  }

  if (items === null) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2 size={20} className="text-accent-soft animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center py-24 gap-3">
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-border flex items-center justify-center">
          <Briefcase size={22} className="text-text-muted" />
        </div>
        <h2 className="text-[15px] font-semibold text-text">No companies watchlisted yet</h2>
        <p className="text-[13px] text-text-muted max-w-sm">
          Research a company from the Search tab, then click "Add to Portfolio" to track it here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <h2 className="text-[15px] font-semibold text-text">Portfolio</h2>
        <span className="text-[11px] text-text-faint">{items.length} watchlisted</span>
      </div>
      <div className="bg-panel border border-border rounded-[10px] overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-panel-alt">
              {['Company', 'Sector', 'Stage', 'Valuation', 'TAM', 'Added', ''].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-left text-[10px] font-semibold tracking-[0.12em] uppercase text-text-muted border-b border-border"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.name} className="hover:bg-white/[0.03] transition-colors">
                <td className="px-4 py-2.5 border-b border-border-soft">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-accent-strong/15 border border-accent/25 flex items-center justify-center text-[11px] font-bold text-accent-soft shrink-0">
                      {item.logoInitial}
                    </div>
                    <span className="text-[13px] font-medium text-text whitespace-nowrap">{item.name}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-[12.5px] text-text-muted border-b border-border-soft whitespace-nowrap">
                  {item.sector ?? '—'}
                </td>
                <td className="px-4 py-2.5 text-[12.5px] text-text-muted border-b border-border-soft whitespace-nowrap">
                  {item.stage ?? '—'}
                </td>
                <td className="px-4 py-2.5 text-[13px] text-text font-mono border-b border-border-soft whitespace-nowrap">
                  {item.valuation ?? '—'}
                </td>
                <td className="px-4 py-2.5 text-[13px] text-text font-mono border-b border-border-soft whitespace-nowrap">
                  {item.tam ?? '—'}
                </td>
                <td className="px-4 py-2.5 text-[11.5px] text-text-faint border-b border-border-soft whitespace-nowrap">
                  {relativeTime(item.addedAt)}
                </td>
                <td className="px-4 py-2.5 border-b border-border-soft">
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => onView(item.name)}
                      className="flex items-center gap-1 text-[11.5px] text-accent-lighter hover:text-accent-soft hover:underline whitespace-nowrap"
                    >
                      View <ArrowRight size={11} />
                    </button>
                    <button
                      onClick={() => handleRemove(item.name)}
                      className="text-text-faint hover:text-negative"
                      title="Remove"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
