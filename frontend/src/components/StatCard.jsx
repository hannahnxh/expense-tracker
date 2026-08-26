export default function StatCard({ label, value, accent = 'text-paper', sub }) {
  return (
    <div className="bg-ink-900 border border-ink-700/60 rounded-lg px-5 py-4 shadow-card">
      <div className="text-xs uppercase tracking-widest text-ink-600 mb-2">{label}</div>
      <div className={`font-display text-2xl tabular ${accent}`}>{value}</div>
      {sub && <div className="text-xs text-ink-600 mt-1">{sub}</div>}
    </div>
  )
}
