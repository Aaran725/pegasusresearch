import { Users, ExternalLink } from 'lucide-react';

export default function FoundingTeam({ team }) {
  const items = team ?? [];
  if (items.length === 0) return null;

  return (
    <div className="bg-panel border border-border rounded-[10px] p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Users size={15} className="text-accent-soft shrink-0" />
        <h3 className="text-[13px] font-semibold text-text">Founding Team</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((m, i) => (
          <div key={i} className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-[13px] font-medium text-text">{m.name}</span>
              {m.role && <span className="text-[11px] text-text-faint">· {m.role}</span>}
            </div>
            {m.background && (
              <p className="text-[12px] text-text-muted leading-relaxed">{m.background}</p>
            )}
            {m.url && (
              <a
                href={m.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-accent-lighter hover:text-accent-soft hover:underline"
              >
                <ExternalLink size={10} />
                source
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
