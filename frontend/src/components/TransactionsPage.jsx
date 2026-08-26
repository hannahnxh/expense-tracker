import { useEffect, useState } from 'react'
import { api } from '../api.js'

const fmt = (n) => `$${Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const today = () => new Date().toISOString().slice(0, 10)

const emptyForm = {
  amount: '',
  type: 'expense',
  date: today(),
  description: '',
  category_id: '',
  savings_destination: '',
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState(null)
  const [filterType, setFilterType] = useState('')

  const load = () => {
    const params = filterType ? { type: filterType } : {}
    api.getTransactions(params).then(setTransactions).catch((e) => setError(e.message))
  }

  useEffect(() => {
    api.getCategories().then(setCategories).catch((e) => setError(e.message))
  }, [])

  useEffect(load, [filterType])

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      await api.createTransaction({
        amount: parseFloat(form.amount),
        type: form.type,
        date: form.date,
        description: form.description,
        category_id: form.type === 'saving' ? null : (form.category_id ? Number(form.category_id) : null),
        savings_destination: form.type === 'saving' ? (form.savings_destination || null) : null,
      })
      setForm({ ...emptyForm, date: form.date })
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  const remove = async (id) => {
    await api.deleteTransaction(id)
    load()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Add form */}
      <form onSubmit={submit} className="bg-ink-900 border border-ink-700/60 rounded-lg p-6 shadow-card h-fit space-y-4">
        <h2 className="font-display text-lg">Add transaction</h2>

        <div className="flex gap-2">
          {['expense', 'income', 'saving'].map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setForm({ ...form, type: t })}
              className={`flex-1 py-2 text-sm rounded-md border capitalize transition-colors ${
                form.type === t
                  ? 'bg-gold text-ink-950 border-gold font-medium'
                  : 'border-ink-700 text-ink-600 hover:text-paper'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

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
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-widest text-ink-600">Date</label>
          <input
            required
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full mt-1 bg-ink-800 border border-ink-700 rounded-md px-3 py-2 focus:outline-none focus:border-gold"
          />
        </div>

        {form.type === 'saving' ? (
          <div>
            <label className="text-xs uppercase tracking-widest text-ink-600">Destination</label>
            <select
              value={form.savings_destination}
              onChange={(e) => setForm({ ...form, savings_destination: e.target.value })}
              className="w-full mt-1 bg-ink-800 border border-ink-700 rounded-md px-3 py-2 focus:outline-none focus:border-gold"
            >
              <option value="">Select…</option>
              <option value="bank">Bank</option>
              <option value="investment">Investment</option>
            </select>
          </div>
        ) : (
          <div>
            <label className="text-xs uppercase tracking-widest text-ink-600">Category</label>
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="w-full mt-1 bg-ink-800 border border-ink-700 rounded-md px-3 py-2 focus:outline-none focus:border-gold"
            >
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="text-xs uppercase tracking-widest text-ink-600">Note</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full mt-1 bg-ink-800 border border-ink-700 rounded-md px-3 py-2 focus:outline-none focus:border-gold"
            placeholder="Optional"
          />
        </div>

        {error && <p className="text-rust-400 text-sm">{error}</p>}

        <button type="submit" className="w-full py-2 rounded-md bg-moss-500 hover:bg-moss-600 text-ink-950 font-medium transition-colors">
          Add
        </button>
      </form>

      {/* List */}
      <div className="lg:col-span-2 bg-ink-900 border border-ink-700/60 rounded-lg p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg">History</h2>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-ink-800 border border-ink-700 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-gold"
          >
            <option value="">All types</option>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="saving">Saving</option>
          </select>
        </div>

        {transactions.length === 0 ? (
          <p className="text-sm text-ink-600 py-8 text-center">Nothing logged yet.</p>
        ) : (
          <div className="divide-y divide-ink-700/60">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-3 text-sm">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-ink-600 tabular text-xs">{t.date}</span>
                    {t.category && (
                      <span className="inline-flex items-center gap-1 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.category.color }} />
                        {t.category.name}
                      </span>
                    )}
                    {t.type === 'saving' && t.savings_destination && (
                      <span className="text-xs capitalize text-gold">{t.savings_destination}</span>
                    )}
                  </div>
                  {t.description && <p className="text-ink-600 truncate mt-0.5">{t.description}</p>}
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span
                    className={`tabular font-medium ${
                      t.type === 'income' ? 'text-moss-400' : t.type === 'saving' ? 'text-gold' : 'text-rust-400'
                    }`}
                  >
                    {t.type === 'expense' ? '−' : '+'}{fmt(t.amount)}
                  </span>
                  <button onClick={() => remove(t.id)} className="text-ink-600 hover:text-rust-400 text-xs">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
