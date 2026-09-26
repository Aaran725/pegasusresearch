export default function StartupHeader({ data }) {
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
