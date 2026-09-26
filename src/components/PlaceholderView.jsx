export default function PlaceholderView({ icon: Icon, title, description }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center py-24 gap-4">
      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-border flex items-center justify-center">
        <Icon size={22} className="text-text-muted" />
      </div>
      <div>
        <h2 className="text-[15px] font-semibold text-text mb-1.5">{title}</h2>
        <p className="text-[13px] text-text-muted max-w-sm">{description}</p>
      </div>
      <span className="text-[10px] tracking-wider uppercase text-text-faint bg-white/5 border border-border rounded-md px-2.5 py-1">
        Coming soon
      </span>
    </div>
  );
}
