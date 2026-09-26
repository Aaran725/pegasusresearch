import { useState, useCallback } from 'react';
import { Briefcase, TrendingUp, Settings, AlertTriangle, Loader2 } from 'lucide-react';
import Sidebar from './components/Sidebar';
import SearchHeader from './components/SearchHeader';
import Dashboard from './components/Dashboard';
import EmptyState from './components/EmptyState';
import PlaceholderView from './components/PlaceholderView';
import { getStartupData } from './data/mockStartups';
import { fetchStartupMemo, hasGroqKeysConfigured } from './services/groqService';

export default function App() {
  const [activeNav, setActiveNav] = useState('search');
  const [query, setQuery] = useState('');
  const [data, setData] = useState(null);
  const [source, setSource] = useState('mock');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  const runSearch = useCallback(async (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setLoading(true);
    setNotice(null);

    if (hasGroqKeysConfigured()) {
      try {
        const memo = await fetchStartupMemo(trimmed);
        setData(memo);
        setSource('groq');
        setLoading(false);
        return;
      } catch {
        setNotice('Live AI analysis is unavailable right now — showing demo data instead.');
      }
    }

    // Fallback: curated or deterministically generated mock data, so the
    // dashboard never breaks even without a working Groq key.
    setData(getStartupData(trimmed));
    setSource('mock');
    setLoading(false);
  }, []);

  const handlePick = (name) => {
    setQuery(name);
    runSearch(name);
  };

  return (
    <div className="min-h-screen flex bg-bg text-text">
      <Sidebar active={activeNav} onNavigate={setActiveNav} />

      <main className="flex-1 min-w-0 px-4 sm:px-6 py-5">
        <div className="max-w-[1360px] mx-auto flex flex-col gap-4 min-h-[calc(100vh-40px)]">
          {activeNav === 'search' && (
            <>
              <SearchHeader
                query={query}
                onQueryChange={setQuery}
                onSubmit={() => runSearch(query)}
                loading={loading}
                statusLabel={
                  loading
                    ? 'Analyzing…'
                    : data
                    ? `Live · ${data.stage}`
                    : 'Idle · awaiting search'
                }
                sectorLabel={data?.sector}
                hasResult={Boolean(data)}
              />

              {notice && (
                <div className="flex items-center gap-2 text-[12px] text-warning bg-warning/10 border border-warning/25 rounded-lg px-3.5 py-2.5">
                  <AlertTriangle size={14} className="shrink-0" />
                  {notice}
                </div>
              )}

              {loading && (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20">
                  <Loader2 size={26} className="text-accent-soft animate-spin" />
                  <p className="text-[13px] text-text-muted">
                    Running due diligence on <span className="text-text font-medium">{query}</span>…
                  </p>
                </div>
              )}

              {!loading && data && <Dashboard data={data} source={source} />}
              {!loading && !data && <EmptyState onPick={handlePick} />}
            </>
          )}

          {activeNav === 'portfolio' && (
            <PlaceholderView
              icon={Briefcase}
              title="Portfolio"
              description="Track live positions, follow-on decisions, and portfolio-company signals in one view."
            />
          )}

          {activeNav === 'trends' && (
            <PlaceholderView
              icon={TrendingUp}
              title="Market Trends"
              description="Sector heatmaps, funding velocity, and emerging category signals across deep tech and physical AI."
            />
          )}

          {activeNav === 'settings' && (
            <PlaceholderView
              icon={Settings}
              title="Settings"
              description="Manage your investment thesis parameters, data sources, and API integrations."
            />
          )}
        </div>
      </main>
    </div>
  );
}
