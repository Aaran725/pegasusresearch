import StartupHeader from './StartupHeader';
import MetricsBar from './MetricsBar';
import AIVerdict from './AIVerdict';
import FundingChart from './FundingChart';
import MarketSizingChart from './MarketSizingChart';
import CompetitorScatterChart from './CompetitorScatterChart';
import CompsTable from './CompsTable';

export default function Dashboard({ data, source }) {
  return (
    <div className="flex flex-col gap-3.5">
      <StartupHeader data={data} />
      <MetricsBar data={data} />
      <AIVerdict data={data} source={source} />

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-3.5">
        <FundingChart data={data.fundingHistory} />
        <MarketSizingChart data={data.marketSizing} />
      </div>

      <CompetitorScatterChart data={data.competitors} />

      <CompsTable data={data.comps} />

      <div className="text-[10px] text-text-dim text-center py-1">
        {source === 'groq+tavily'
          ? 'Synthesized from live web search — verify critical figures against the linked sources before acting on them'
          : data.isGenerated
          ? 'Directional estimate · not verified against primary sources'
          : 'Illustrative data for demo purposes'}{' '}
        · Pegasus Analyst AI
      </div>
    </div>
  );
}
