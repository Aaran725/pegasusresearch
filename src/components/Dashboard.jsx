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

export default function Dashboard({ data, source, onRefresh }) {
  const isLive = source === 'groq+tavily';

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <StartupHeader data={data} />
        {isLive && (
          <ResearchMeta
            fetchedAt={data.fetchedAt}
            cached={data.cached}
            stale={data.stale}
            onRefresh={onRefresh}
          />
        )}
      </div>

      <MetricsBar data={data} />
      <AIVerdict data={data} source={source} />

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
