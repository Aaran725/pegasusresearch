import { useEffect, useRef, useState } from 'react';
import { Search, Download, Loader2, Sparkles } from 'lucide-react';

export default function SearchHeader({
  query,
  onQueryChange,
  onSubmit,
  loading,
  statusLabel,
  sectorLabel,
  hasResult,
  onExport,
  depth,
  onDepthChange,
}) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <header className="flex items-center gap-3.5 flex-wrap pb-3.5 border-b border-border">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className={`flex-1 min-w-[240px] flex items-center gap-2.5 bg-panel border rounded-lg px-3 py-2 transition-colors ${
          focused ? 'border-accent-strong' : 'border-border'
        }`}
      >
        <Search size={15} className="text-text-faint shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Type a startup name or URL — e.g. Anthropic, Figure AI…"
          className="flex-1 bg-transparent border-none outline-none text-[13px] text-text placeholder:text-text-faint min-w-[60px]"
        />
        <span className="hidden sm:flex items-center gap-0.5 text-[11px] font-mono text-text-muted bg-white/5 border border-border rounded-md px-1.5 py-0.5">
          ⌘K
        </span>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="flex items-center gap-1.5 text-[12.5px] font-semibold text-white bg-accent-strong hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed rounded-md px-3 py-1.5 transition-colors shrink-0"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          {loading ? 'Analyzing…' : 'Analyze'}
        </button>
      </form>

      <div
        className="flex items-center bg-white/5 border border-border rounded-md p-0.5 shrink-0"
        title="Standard: ~13 Tavily credits/search. Deep: ~36 credits/search — 2x more research topics, deeper competitor coverage, and up to 3 rounds of adaptive gap-filling."
      >
        {['standard', 'deep'].map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onDepthChange(mode)}
            disabled={loading}
            className={`text-[11px] font-semibold capitalize rounded px-2.5 py-1 transition-colors disabled:cursor-not-allowed ${
              depth === mode
                ? 'bg-accent-strong text-white'
                : 'text-text-muted hover:text-text'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <span className="flex items-center gap-1.5 text-[11px] text-text-muted bg-white/5 border border-border rounded-md px-2.5 py-1.5 whitespace-nowrap">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              hasResult ? 'bg-positive' : 'bg-text-dim'
            }`}
          />
          {statusLabel}
        </span>
        {sectorLabel && (
          <span className="hidden lg:inline text-[11px] text-text-muted bg-white/5 border border-border rounded-md px-2.5 py-1.5 whitespace-nowrap">
            {sectorLabel}
          </span>
        )}
      </div>

      <button
        type="button"
        disabled={!hasResult}
        onClick={onExport}
        className="flex items-center gap-1.5 shrink-0 text-[12.5px] font-semibold text-text bg-panel-alt hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed border border-border hover:border-white/20 rounded-lg px-3.5 py-2 transition-colors"
      >
        <Download size={14} />
        Export Memo
      </button>
    </header>
  );
}
