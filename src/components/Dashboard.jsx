import { Bookmark, BookmarkCheck } from 'lucide-react';
import StartupHeader from './StartupHeader';
import MetricsBar from './MetricsBar';
import AIVerdict from './AIVerdict';
import ResearchMeta from './ResearchMeta';
import FundingChart from './FundingChart';
import MarketSizingChart from './MarketSizingChart';
import CompetitorScatterChart from './CompetitorScatterChart';
import CompsTable from './CompsTable';
import NewsTimeline from './NewsTimeline';
import RiskFlags from './RiskFlags';
import FoundingTeam from './FoundingTeam';
import DueDiligenceNotes from './DueDiligenceNotes';
import PegasusFitCard from './PegasusFitCard';

export default function Dashboard({ data, source, onRefresh, onSaveField, inPortfolio, onToggleWatchlist }) {
  const isLive = source === 'groq+tavily';

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <StartupHeader data={data} />
        <div className="flex items-center gap-3 flex-wrap">
          {isLive && (
            <ResearchMeta
              fetchedAt={data.fetchedAt}
              cached={data.cached}
              stale={data.stale}
              depth={data.depth}
              onRefresh={onRefresh}
            />
          )}
          <button
            type="button"
            onClick={onToggleWatchlist}
            className={`flex items-center gap-1.5 text-[11.5px] font-medium rounded-md px-2.5 py-1.5 border transition-colors ${
              inPortfolio
                ? 'text-accent-soft bg-accent/10 border-accent/25'
                : 'text-text-muted bg-white/5 border-border hover:text-text hover:border-white/20'
            }`}
          >
            {inPortfolio ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
            {inPortfolio ? 'In Portfolio' : 'Add to Portfolio'}
          </button>
        </div>
      </div>

      {isLive && <PegasusFitCard fit={data.pegasusFit} />}

      <MetricsBar data={data} editable={isLive} onSaveField={onSaveField} />
      <AIVerdict data={data} source={source} onSaveField={isLive ? onSaveField : null} />

      {isLive && <RiskFlags flags={data.riskFlags} />}

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-3.5">
        <FundingChart data={data.fundingHistory} />
        <MarketSizingChart data={data.marketSizing} />
      </div>

      <CompetitorScatterChart data={data.competitors} />

      <CompsTable data={data.comps} />

      {isLive && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          <NewsTimeline events={data.newsTimeline} />
          <FoundingTeam team={data.team} />
        </div>
      )}

      {isLive && data.depth === 'deep' && <DueDiligenceNotes data={data} />}

      <div className="text-[10px] text-text-dim text-center py-1">
        {isLive
          ? 'Synthesized from live web search — verify critical figures against the linked sources before acting on them'
          : data.isGenerated
          ? 'Directional estimate · not verified against primary sources'
          : 'Illustrative data for demo purposes'}{' '}
        · Pegasus Analyst AI
      </div>
    </div>
  );
}
