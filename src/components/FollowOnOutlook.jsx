import { CalendarClock } from 'lucide-react';

export default function FollowOnOutlook({ outlook }) {
  if (!outlook) return null;

  return (
    <div className="bg-panel border border-border rounded-[10px] p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <CalendarClock size={15} className="text-accent-soft shrink-0" />
        <h3 className="text-[13px] font-semibold text-text">Follow-on Funding Outlook</h3>
      </div>
      <p className="text-[12.5px] text-text-muted leading-relaxed">{outlook}</p>
    </div>
  );
}
