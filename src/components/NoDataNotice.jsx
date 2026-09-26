import { SearchX } from 'lucide-react';

export default function NoDataNotice({ label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 h-[260px] text-center px-4">
      <SearchX size={20} className="text-text-dim" />
      <p className="text-[12px] text-text-faint max-w-[240px]">
        No {label} evidence found in the web search — not fabricating a placeholder here.
      </p>
    </div>
  );
}
