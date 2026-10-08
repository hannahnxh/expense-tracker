import { useState } from 'react'
import Sheet from './Sheet.jsx'
import { useLedger, actions } from '../lib/store.js'
import { today } from '../lib/ledger.js'

const TYPES = [
  ['expense', 'Expense'],
  ['income', 'Income'],
  ['saving', 'Saving'],
]

const fieldLabel = 'text-[11px] uppercase tracking-widest text-ink-500'
const fieldBox =
  'block w-full min-h-[3.25rem] mt-1.5 bg-ink-800 border border-ink-700 rounded-lg px-3.5 py-3 text-paper placeholder:text-ink-600 focus:outline-none focus:border-gold'

export default function AddTransactionSheet({ onClose }) {
  const { categories } = useLedger()
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(today())
  const [categoryId, setCategoryId] = useState('')
  const [destination, setDestination] = useState('bank')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const value = parseFloat(amount)
    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter an amount greater than 0.')
      return
    }
    actions.addTransaction({
      type,
      amount: Math.round(value * 100) / 100,
      date,
      description: note.trim(),
      category_id: type === 'expense' && categoryId ? categoryId : null,
      savings_destination: type === 'saving' ? destination : null,
    })
    onClose()
  }

  return (
    <Sheet title="Add transaction" onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        <div className="grid grid-cols-3 gap-2" role="group" aria-label="Transaction type">
          {TYPES.map(([id, label]) => (
            <button
              type="button"
              key={id}
              aria-pressed={type === id}
              onClick={() => setType(id)}
              className={`py-2.5 text-sm rounded-lg border transition-colors ${
                type === id ? 'bg-gold text-ink-950 border-gold font-semibold' : 'border-ink-700 text-ink-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <label className="block">
          <span className={fieldLabel}>Amount</span>
          <input
            autoFocus
            inputMode="decimal"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className={`${fieldBox} tabular text-2xl font-display`}
          />
        </label>

        {type === 'saving' && (
          <div>
            <span className={fieldLabel}>Where did it go?</span>
            <div className="grid grid-cols-2 gap-2 mt-1.5" role="group" aria-label="Savings destination">
              {[
                ['bank', 'Bank savings'],
                ['investment', 'Investments'],
              ].map(([id, label]) => (
                <button
                  type="button"
                  key={id}
                  aria-pressed={destination === id}
                  onClick={() => setDestination(id)}
                  className={`py-2.5 text-sm rounded-lg border ${
                    destination === id ? 'border-gold text-gold bg-gold/10 font-medium' : 'border-ink-700 text-ink-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {type === 'expense' && (
          <label className="block">
            <span className={fieldLabel}>Category</span>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={fieldBox}>
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block">
          <span className={fieldLabel}>Date</span>
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={fieldBox} />
        </label>

        <label className="block">
          <span className={fieldLabel}>Note</span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional"
            className={fieldBox}
          />
        </label>

        {error && (
          <p role="alert" className="text-rust-400 text-sm">
            {error}
          </p>
        )}

        <button type="submit" className="w-full py-3.5 rounded-xl bg-gold active:bg-gold-600 text-ink-950 font-semibold">
          Add {type}
        </button>
      </form>
    </Sheet>
  )
}
