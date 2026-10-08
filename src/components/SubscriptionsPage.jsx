import { useMemo, useState } from 'react'
import Sheet from './Sheet.jsx'
import { useLedger, actions } from '../lib/store.js'
import { makeFmt, subscriptionTotals, daysUntil, today } from '../lib/ledger.js'

const fieldLabel = 'text-[11px] uppercase tracking-widest text-ink-500'
const fieldBox = 'w-full mt-1.5 bg-ink-800 border border-ink-700 rounded-lg px-3 py-3 focus:outline-none focus:border-gold'

function AddSubscriptionSheet({ onClose }) {
  const { categories } = useLedger()
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [cycle, setCycle] = useState('monthly')
  const [next, setNext] = useState(today())
  const [categoryId, setCategoryId] = useState('')
  const [error, setError] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const value = parseFloat(amount)
    if (!name.trim()) return setError('Give the subscription a name.')
    if (!Number.isFinite(value) || value <= 0) return setError('Enter an amount greater than 0.')
    actions.addSubscription({
      name: name.trim(),
      amount: Math.round(value * 100) / 100,
      billing_cycle: cycle,
      next_billing_date: next,
      category_id: categoryId || null,
    })
    onClose()
  }

  return (
    <Sheet title="Add subscription" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className={fieldLabel}>Name</span>
          <input autoFocus type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Netflix" className={fieldBox} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={fieldLabel}>Amount</span>
            <input inputMode="decimal" type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className={`${fieldBox} tabular`} />
          </label>
          <label className="block">
            <span className={fieldLabel}>Billed</span>
            <select value={cycle} onChange={(e) => setCycle(e.target.value)} className={fieldBox}>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="weekly">Weekly</option>
            </select>
          </label>
        </div>
        <label className="block">
          <span className={fieldLabel}>Next charge</span>
          <input type="date" required value={next} onChange={(e) => setNext(e.target.value)} className={fieldBox} />
        </label>
        <label className="block">
          <span className={fieldLabel}>Category</span>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={fieldBox}>
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        {error && (
          <p role="alert" className="text-rust-400 text-sm">
            {error}
          </p>
        )}
        <button type="submit" className="w-full py-3.5 rounded-xl bg-gold active:bg-gold-600 text-ink-950 font-semibold">
          Add subscription
        </button>
      </form>
    </Sheet>
  )
}

export default function SubscriptionsPage() {
  const state = useLedger()
  const fmt = makeFmt(state.settings.currency)
  const [adding, setAdding] = useState(false)
  const [openId, setOpenId] = useState(null)

  const totals = subscriptionTotals(state)
  const catById = useMemo(() => new Map(state.categories.map((c) => [c.id, c])), [state.categories])
  const sorted = useMemo(
    () => [...state.subscriptions].sort((a, b) => Number(b.active) - Number(a.active) || a.next_billing_date.localeCompare(b.next_billing_date)),
    [state.subscriptions],
  )

  const remove = (s) => {
    if (window.confirm(`Delete ${s.name}?`)) {
      actions.deleteSubscription(s.id)
      setOpenId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-ink-900 border border-ink-700/70 rounded-xl p-5 shadow-card flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-ink-500">Monthly commitment</p>
          <p className="font-display text-3xl tabular text-amber-400 mt-1">{fmt(totals.monthly)}</p>
          <p className="text-xs text-ink-500 mt-1">
            {fmt(totals.yearly)} a year · {totals.activeCount} active
          </p>
        </div>
        <button onClick={() => setAdding(true)} className="px-4 py-3 rounded-xl bg-gold active:bg-gold-600 text-ink-950 font-semibold text-sm shrink-0">
          Add
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-ink-500 text-center py-12">No subscriptions yet. Add Netflix, Spotify, your gym — anything that renews.</p>
      ) : (
        <ul className="bg-ink-900 border border-ink-700/70 rounded-xl divide-y divide-ink-700/60 overflow-hidden">
          {sorted.map((s) => {
            const d = daysUntil(s.next_billing_date)
            const cat = catById.get(s.category_id)
            const open = openId === s.id
            return (
              <li key={s.id} className={s.active ? '' : 'opacity-50'}>
                <button onClick={() => setOpenId(open ? null : s.id)} aria-expanded={open} className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left active:bg-ink-800">
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      {cat && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />}
                      <span className="text-sm font-medium truncate">{s.name}</span>
                    </span>
                    <span className="block text-xs text-ink-500 mt-0.5">
                      {s.active ? (
                        <>
                          Next {s.next_billing_date}
                          {d <= 7 && <span className="text-rust-400"> · {d === 0 ? 'today' : d === 1 ? 'tomorrow' : `in ${d} days`}</span>}
                        </>
                      ) : (
                        'Paused'
                      )}
                    </span>
                  </span>
                  <span className="text-right shrink-0">
                    <span className="block tabular text-sm font-medium">{fmt(s.amount)}</span>
                    <span className="block text-xs text-ink-500 capitalize">{s.billing_cycle}</span>
                  </span>
                </button>
                {open && (
                  <div className="px-4 pb-3 flex justify-end gap-2">
                    <button
                      onClick={() => {
                        actions.toggleSubscription(s.id)
                        setOpenId(null)
                      }}
                      className="text-sm px-3 py-2 rounded-lg border border-ink-700 text-paper active:bg-ink-800"
                    >
                      {s.active ? 'Pause' : 'Resume'}
                    </button>
                    <button onClick={() => remove(s)} className="text-sm text-rust-400 px-3 py-2 rounded-lg border border-rust-500/40 active:bg-rust-500/10">
                      Delete
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {adding && <AddSubscriptionSheet onClose={() => setAdding(false)} />}
    </div>
  )
}
