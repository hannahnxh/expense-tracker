import { useMemo, useState } from 'react'
import { useLedger, actions } from '../lib/store.js'
import { makeFmt } from '../lib/ledger.js'
import { theme } from '../lib/theme.js'

const FILTERS = [
  ['all', 'All'],
  ['expense', 'Spent'],
  ['income', 'Income'],
  ['saving', 'Saved'],
]

function dayHeading(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-SG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ActivityPage() {
  const state = useLedger()
  const fmt = makeFmt(state.settings.currency)
  const [filter, setFilter] = useState('all')
  const [openId, setOpenId] = useState(null)
  const [limit, setLimit] = useState(100)

  const catById = useMemo(() => new Map(state.categories.map((c) => [c.id, c])), [state.categories])

  const rows = useMemo(
    () =>
      state.transactions
        .filter((t) => filter === 'all' || t.type === filter)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [state.transactions, filter],
  )

  const groups = useMemo(() => {
    const out = []
    for (const t of rows.slice(0, limit)) {
      const last = out[out.length - 1]
      if (last && last.date === t.date) last.items.push(t)
      else out.push({ date: t.date, items: [t] })
    }
    return out
  }, [rows, limit])

  const remove = (t) => {
    if (window.confirm(`Delete this ${t.type} of ${fmt(t.amount)}?`)) {
      actions.deleteTransaction(t.id)
      setOpenId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto -mx-1 px-1" role="group" aria-label="Filter by type">
        {FILTERS.map(([id, label]) => (
          <button
            key={id}
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
            className={`px-4 py-2 rounded-full text-sm border whitespace-nowrap ${
              filter === id ? 'bg-paper text-ink-950 border-paper font-medium' : 'border-ink-700 text-ink-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-ink-500 text-center py-12">
          {state.transactions.length === 0 ? 'Nothing logged yet. Tap + to add your first transaction.' : 'Nothing matches this filter.'}
        </p>
      ) : (
        <>
          {groups.map((g) => (
            <section key={g.date}>
              <h3 className="text-[11px] uppercase tracking-widest text-ink-500 mb-1.5 px-1">{dayHeading(g.date)}</h3>
              <ul className="bg-ink-900 border border-ink-700/70 rounded-xl divide-y divide-ink-700/60 overflow-hidden">
                {g.items.map((t) => {
                  const cat = catById.get(t.category_id)
                  const label =
                    t.type === 'income'
                      ? 'Income'
                      : t.type === 'saving'
                        ? t.savings_destination === 'investment'
                          ? 'Investments'
                          : 'Bank savings'
                        : cat?.name || 'Uncategorized'
                  const color = t.type === 'income' ? theme.incomeBar : t.type === 'saving' ? theme.accent : cat?.color || '#9CA3AF'
                  const amountClass = t.type === 'income' ? 'text-moss-400' : t.type === 'saving' ? 'text-gold' : 'text-rust-400'
                  const open = openId === t.id
                  return (
                    <li key={t.id}>
                      <button
                        onClick={() => setOpenId(open ? null : t.id)}
                        aria-expanded={open}
                        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left active:bg-ink-800"
                      >
                        <span className="flex items-center gap-3 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <span className="min-w-0">
                            <span className="block text-sm truncate">{label}</span>
                            {t.description && <span className="block text-xs text-ink-500 truncate">{t.description}</span>}
                          </span>
                        </span>
                        <span className={`tabular text-sm font-medium shrink-0 ${amountClass}`}>
                          {t.type === 'expense' ? '−' : '+'}
                          {fmt(t.amount)}
                        </span>
                      </button>
                      {open && (
                        <div className="px-4 pb-3 flex justify-end">
                          <button onClick={() => remove(t)} className="text-sm text-rust-400 px-3 py-2 rounded-lg border border-rust-500/40 active:bg-rust-500/10">
                            Delete
                          </button>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
          {rows.length > limit && (
            <button onClick={() => setLimit(limit + 100)} className="w-full py-3 text-sm text-ink-500 border border-ink-700 rounded-xl">
              Show more ({rows.length - limit} older)
            </button>
          )}
        </>
      )}
    </div>
  )
}
