import { useEffect, useState } from 'react'
import { api } from '../api.js'

const fmt = (n) => `$${Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const today = () => new Date().toISOString().slice(0, 10)

const emptyForm = {
  name: '',
  amount: '',
  billing_cycle: 'monthly',
  next_billing_date: today(),
  category_id: '',
  notes: '',
}

function daysUntil(dateStr) {
  const diff = Math.ceil((new Date(dateStr) - new Date(today())) / (1000 * 60 * 60 * 24))
  return diff
}

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState(null)

  const load = () => {
    api.getSubscriptions().then(setSubs).catch((e) => setError(e.message))
  }

  useEffect(() => {
    load()
    api.getCategories().then(setCategories).catch((e) => setError(e.message))
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      await api.createSubscription({
        name: form.name,
        amount: parseFloat(form.amount),
        billing_cycle: form.billing_cycle,
        next_billing_date: form.next_billing_date,
        category_id: form.category_id ? Number(form.category_id) : null,
        active: true,
        notes: form.notes,
      })
      setForm(emptyForm)
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  const toggleActive = async (s) => {
    await api.updateSubscription(s.id, { ...s, active: !s.active, category_id: s.category?.id ?? null })
    load()
  }

  const remove = async (id) => {
    await api.deleteSubscription(id)
    load()
  }

  const monthlyTotal = subs
    .filter((s) => s.active)
    .reduce((sum, s) => {
      const mult = s.billing_cycle === 'yearly' ? 1 / 12 : s.billing_cycle === 'weekly' ? 52 / 12 : 1
      return sum + s.amount * mult
    }, 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <form onSubmit={submit} className="bg-ink-900 border border-ink-700/60 rounded-lg p-6 shadow-card h-fit space-y-4">
        <h2 className="font-display text-lg">Add subscription</h2>

        <div>
          <label className="text-xs uppercase tracking-widest text-ink-600">Name</label>
          <input
            required
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full mt-1 bg-ink-800 border border-ink-700 rounded-md px-3 py-2 focus:outline-none focus:border-gold"
            placeholder="Netflix"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs uppercase tracking-widest text-ink-600">Amount</label>
            <input
              required
              type="number"
              step="0.01"
              min="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full mt-1 bg-ink-800 border border-ink-700 rounded-md px-3 py-2 tabular focus:outline-none focus:border-gold"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-ink-600">Cycle</label>
            <select
              value={form.billing_cycle}
              onChange={(e) => setForm({ ...form, billing_cycle: e.target.value })}
              className="w-full mt-1 bg-ink-800 border border-ink-700 rounded-md px-3 py-2 focus:outline-none focus:border-gold"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs uppercase tracking-widest text-ink-600">Next billing date</label>
          <input
            required
            type="date"
            value={form.next_billing_date}
            onChange={(e) => setForm({ ...form, next_billing_date: e.target.value })}
            className="w-full mt-1 bg-ink-800 border border-ink-700 rounded-md px-3 py-2 focus:outline-none focus:border-gold"
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-widest text-ink-600">Category</label>
          <select
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            className="w-full mt-1 bg-ink-800 border border-ink-700 rounded-md px-3 py-2 focus:outline-none focus:border-gold"
          >
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {error && <p className="text-rust-400 text-sm">{error}</p>}

        <button type="submit" className="w-full py-2 rounded-md bg-moss-500 hover:bg-moss-600 text-ink-950 font-medium transition-colors">
          Add subscription
        </button>
      </form>

      <div className="lg:col-span-2 space-y-4">
        <div className="bg-ink-900 border border-ink-700/60 rounded-lg p-6 shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-ink-600">Active monthly commitment</p>
            <p className="font-display text-3xl tabular text-amber-400 mt-1">{fmt(monthlyTotal)}</p>
          </div>
          <p className="text-sm text-ink-600 text-right">
            {subs.filter((s) => s.active).length} active subscription{subs.filter((s) => s.active).length === 1 ? '' : 's'}
          </p>
        </div>

        <div className="bg-ink-900 border border-ink-700/60 rounded-lg p-6 shadow-card">
          {subs.length === 0 ? (
            <p className="text-sm text-ink-600 py-8 text-center">No subscriptions tracked yet.</p>
          ) : (
            <div className="divide-y divide-ink-700/60">
              {subs.map((s) => {
                const due = daysUntil(s.next_billing_date)
                return (
                  <div key={s.id} className={`flex items-center justify-between py-3 text-sm ${!s.active ? 'opacity-40' : ''}`}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{s.name}</span>
                        {s.category && (
                          <span className="inline-flex items-center gap-1 text-xs text-ink-600">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.category.color }} />
                            {s.category.name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-600 mt-0.5">
                        Renews {s.next_billing_date}
                        {s.active && due <= 7 && due >= 0 && (
                          <span className="text-rust-400"> · due in {due}d</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="tabular capitalize text-ink-600 text-xs">{s.billing_cycle}</span>
                      <span className="tabular font-medium">{fmt(s.amount)}</span>
                      <button onClick={() => toggleActive(s)} className="text-xs text-ink-600 hover:text-gold">
                        {s.active ? 'Pause' : 'Resume'}
                      </button>
                      <button onClick={() => remove(s.id)} className="text-xs text-ink-600 hover:text-rust-400">
                        Remove
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
