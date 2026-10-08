export default function StatCard({ label, value, accent = 'text-paper', sub }) {
  return (
    <div className="bg-ink-900 border border-ink-700/70 rounded-xl px-4 py-3.5 shadow-card min-w-0">
      <div className="text-[11px] uppercase tracking-widest text-ink-500 mb-1.5">{label}</div>
      <div className={`font-display text-[22px] leading-tight tabular truncate ${accent}`}>{value}</div>
      {sub && <div className="text-xs text-ink-500 mt-1">{sub}</div>}
    </div>
  )
}
