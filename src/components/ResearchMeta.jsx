import { RefreshCw, Clock } from 'lucide-react';

function relativeTime(ts) {
  const diffMs = Date.now() - ts;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ResearchMeta({ fetchedAt, cached, stale, onRefresh }) {
  if (!fetchedAt) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap text-[11px]">
      <span className="flex items-center gap-1 text-text-faint">
        <Clock size={11} />
        Researched {relativeTime(fetchedAt)}
        {cached && ' · cached'}
      </span>
      {stale && (
        <span className="text-warning bg-warning/10 border border-warning/25 rounded-md px-1.5 py-0.5">
          stale — data is over 24h old
        </span>
      )}
      <button
        onClick={onRefresh}
        className="flex items-center gap-1 text-accent-lighter hover:text-accent-soft hover:underline"
      >
        <RefreshCw size={11} />
        Refresh (uses live search quota)
      </button>
    </div>
  );
}
