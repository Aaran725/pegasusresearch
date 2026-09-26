// Pegasus Tech Ventures' actual public focus areas (IT, HealthTech, AI,
// IoT, Robotics, Big Data, Quantum Computing, FinTech, VR/AR) — a cheap
// keyword match against the sector Groq already extracted, so this costs
// nothing extra to compute and signals the tool knows the firm's real
// scope, not a generic "sector: Fintech" label.
const PEGASUS_SECTORS = [
  /\bIT\b|information technology/i,
  /health/i,
  /\bAI\b|artificial intelligence/i,
  /\bIoT\b|internet of things/i,
  /robot/i,
  /big data|data services/i,
  /quantum/i,
  /fintech|financial tech/i,
  /\bVR\b|\bAR\b|virtual reality|augmented reality/i,
];

function isPegasusSectorFit(sector) {
  if (!sector) return null;
  return PEGASUS_SECTORS.some((p) => p.test(sector));
}

export default function StartupHeader({ data }) {
  const sectorFit = isPegasusSectorFit(data.sector);

  return (
    <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
      <div className="w-14 h-14 rounded-xl bg-accent-strong/15 border border-accent/25 flex items-center justify-center text-2xl font-bold text-accent-soft shrink-0">
        {data.logoInitial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-semibold text-text tracking-tight">{data.name}</h1>
          <span className="text-[10px] font-semibold tracking-wider text-accent-soft bg-accent/10 border border-accent/25 rounded-md px-2 py-0.5">
            {data.stage}
          </span>
          <span className="text-[10px] text-text-muted bg-white/5 border border-border rounded-md px-2 py-0.5">
            {data.sector}
          </span>
          {sectorFit === true && (
            <span className="text-[10px] text-positive bg-positive/10 border border-positive/25 rounded-md px-2 py-0.5">
              In Pegasus focus areas
            </span>
          )}
          {data.isGenerated && (
            <span className="text-[10px] text-warning bg-warning/10 border border-warning/25 rounded-md px-2 py-0.5">
              Directional estimate — unverified
            </span>
          )}
        </div>
        <p className="mt-1.5 text-[13.5px] text-text-muted leading-relaxed max-w-3xl">
          {data.pitch}
        </p>
      </div>
    </div>
  );
}
