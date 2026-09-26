import { useState } from 'react';
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
import DashboardTabs from './DashboardTabs';
import ExecutiveSummary from './ExecutiveSummary';
import InvestmentRecommendation from './InvestmentRecommendation';
import DealSnapshot from './DealSnapshot';
import SwotGrid from './SwotGrid';
import CompetitiveMoat from './CompetitiveMoat';
import UnitEconomics from './UnitEconomics';
import MarketTrends from './MarketTrends';
import ExitLandscape from './ExitLandscape';
import FollowOnOutlook from './FollowOnOutlook';
import ResearchMethodology from './ResearchMethodology';
import SourcesConfidence from './SourcesConfidence';
import CheckSizeGauge from './CheckSizeGauge';

export default function Dashboard({ data, source, onRefresh, onSaveField, inPortfolio, onToggleWatchlist }) {
  const isLive = source === 'groq+tavily';
  const [activeSection, setActiveSection] = useState('overview');

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

      <DashboardTabs active={activeSection} onChange={setActiveSection} />

      {activeSection === 'overview' && (
        <div className="flex flex-col gap-3.5">
          <DealSnapshot snapshot={data.dealSnapshot} />
          <ExecutiveSummary items={data.executiveSummary} />
          <InvestmentRecommendation recommendation={data.investmentRecommendation} />
          {!data.isGenerated && <PegasusFitCard fit={data.pegasusFit} />}
          <MetricsBar data={data} editable={isLive} onSaveField={onSaveField} />
        </div>
      )}

      {activeSection === 'thesis' && (
        <div className="flex flex-col gap-3.5">
          <AIVerdict data={data} source={source} onSaveField={isLive ? onSaveField : null} />
          <SwotGrid swot={data.swot} />
          <CompetitiveMoat moat={data.competitiveMoat} />
        </div>
      )}

      {activeSection === 'financials' && (
        <div className="flex flex-col gap-3.5">
          <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-3.5">
            <FundingChart data={data.fundingHistory} />
            <MarketSizingChart data={data.marketSizing} />
          </div>
          <CheckSizeGauge fundingHistory={data.fundingHistory} />
          <UnitEconomics economics={data.unitEconomics} />
          <MarketTrends trends={data.marketTrends} />
        </div>
      )}

      {activeSection === 'competitive' && (
        <div className="flex flex-col gap-3.5">
          <CompetitorScatterChart data={data.competitors} />
          <CompsTable data={data.comps} />
          <ExitLandscape exits={data.exitLandscape} />
        </div>
      )}

      {activeSection === 'diligence' && (
        <div className="flex flex-col gap-3.5">
          <FoundingTeam team={data.team} />
          <DueDiligenceNotes data={data} />
          <FollowOnOutlook outlook={data.followOnOutlook} />
        </div>
      )}

      {activeSection === 'risk' && (
        <div className="flex flex-col gap-3.5">
          {isLive && <RiskFlags flags={data.riskFlags} />}
          <NewsTimeline events={data.newsTimeline} />
        </div>
      )}

      {activeSection === 'sources' && (
        <div className="flex flex-col gap-3.5">
          <SourcesConfidence data={data} />
          <ResearchMethodology trace={data.researchTrace} depth={data.depth} />
        </div>
      )}

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
