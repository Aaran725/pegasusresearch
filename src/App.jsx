import { useState, useCallback, useEffect } from 'react';
import { Settings, AlertTriangle, Loader2 } from 'lucide-react';
import Sidebar from './components/Sidebar';
import SearchHeader from './components/SearchHeader';
import Dashboard from './components/Dashboard';
import EmptyState from './components/EmptyState';
import PlaceholderView from './components/PlaceholderView';
import PortfolioView from './components/PortfolioView';
import TrendsView from './components/TrendsView';
import { getStartupData } from './data/mockStartups';
import { fetchStartupMemo, fetchQuotaUsage, saveMemoEdit } from './services/researchService';
import { fetchPortfolio, addToPortfolio, removeFromPortfolio } from './services/portfolioService';
import { downloadMemoPdf } from './utils/exportMemo';

const NOTICE_BY_CODE = {
  no_evidence:
    'No public web results found for this name — it may not exist, or may not have any online footprint. Showing a directional estimate instead.',
  search_failed: 'Live web search is unavailable right now — showing demo data instead.',
  synthesis_failed: 'Found web evidence, but memo synthesis failed — showing demo data instead.',
  quota_exhausted: 'Monthly live-search quota is used up — showing demo data instead.',
  network_error: 'Could not reach the research backend — showing demo data instead.',
};

export default function App() {
  const [activeNav, setActiveNav] = useState('search');
  const [query, setQuery] = useState('');
  const [data, setData] = useState(null);
  const [source, setSource] = useState('mock');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [quota, setQuota] = useState(null);
  const [portfolioNames, setPortfolioNames] = useState(new Set());

  const refreshQuota = useCallback(() => {
    fetchQuotaUsage().then(setQuota).catch(() => {});
  }, []);

  useEffect(() => {
    refreshQuota();
    fetchPortfolio()
      .then((items) => setPortfolioNames(new Set(items.map((i) => i.name.toLowerCase()))))
      .catch(() => {});
  }, [refreshQuota]);

  const runSearch = useCallback(
    async (name, { forceRefresh = false } = {}) => {
      const trimmed = name.trim();
      if (!trimmed) return;

      setLoading(true);
      setNotice(null);

      try {
        const memo = await fetchStartupMemo(trimmed, { forceRefresh });
        setData(memo);
        setSource('groq+tavily');
        setLoading(false);
        refreshQuota();
        return;
      } catch (err) {
        setNotice(NOTICE_BY_CODE[err.code] ?? NOTICE_BY_CODE.network_error);
      }

      // Fallback: curated or deterministically generated mock data, so the
      // dashboard never breaks even without a working search/model pipeline.
      setData(getStartupData(trimmed));
      setSource('mock');
      setLoading(false);
      refreshQuota();
    },
    [refreshQuota]
  );

  const handlePick = (name) => {
    setQuery(name);
    runSearch(name);
  };

  const handleRefresh = () => {
    if (query) runSearch(query, { forceRefresh: true });
  };

  const handleViewFromPortfolio = (name) => {
    setActiveNav('search');
    setQuery(name);
    runSearch(name); // served from cache if already researched — instant, no quota spent
  };

  const handleSaveField = async (field, value) => {
    if (!data?.name) return;
    const { edits } = await saveMemoEdit(data.name, field, value);
    setData((prev) => ({ ...prev, ...edits, editedFields: Object.keys(edits) }));
  };

  const handleToggleWatchlist = async () => {
    if (!data?.name) return;
    const key = data.name.toLowerCase();
    if (portfolioNames.has(key)) {
      await removeFromPortfolio(data.name);
      setPortfolioNames((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    } else {
      await addToPortfolio({
        name: data.name,
        sector: data.sector,
        stage: data.stage,
        valuation: data.valuation,
        tam: data.tam,
        logoInitial: data.logoInitial,
      });
      setPortfolioNames((prev) => new Set(prev).add(key));
    }
  };

  return (
    <div className="min-h-screen flex bg-bg text-text">
      <Sidebar active={activeNav} onNavigate={setActiveNav} quota={quota} />

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
                    ? `${source === 'groq+tavily' ? 'Live research' : 'Demo data'} · ${data.stage}`
                    : 'Idle · awaiting search'
                }
                sectorLabel={data?.sector}
                hasResult={Boolean(data)}
                onExport={() => data && downloadMemoPdf(data, { source })}
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
                  <p className="text-[13px] text-text-muted text-center max-w-xs">
                    Searching the live web and cross-checking sources on{' '}
                    <span className="text-text font-medium">{query}</span>… this runs several
                    searches, so it can take up to a minute.
                  </p>
                </div>
              )}

              {!loading && data && (
                <Dashboard
                  data={data}
                  source={source}
                  onRefresh={handleRefresh}
                  onSaveField={handleSaveField}
                  inPortfolio={portfolioNames.has(data.name.toLowerCase())}
                  onToggleWatchlist={handleToggleWatchlist}
                />
              )}
              {!loading && !data && <EmptyState onPick={handlePick} />}
            </>
          )}

          {activeNav === 'portfolio' && <PortfolioView onView={handleViewFromPortfolio} />}

          {activeNav === 'trends' && <TrendsView />}

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
