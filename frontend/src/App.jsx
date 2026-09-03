import { useState } from 'react'
import Dashboard from './components/Dashboard.jsx'
import TransactionsPage from './components/TransactionsPage.jsx'
import SubscriptionsPage from './components/SubscriptionsPage.jsx'
import CashStackIcon from './components/CashStackIcon.jsx'

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'subscriptions', label: 'Subscriptions' },
]

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const today = new Date()
  const dateStr = today.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="min-h-screen bg-ink-950 text-paper font-body">
      <header className="border-b border-ink-700/60">
        <div className="max-w-6xl mx-auto px-6 pt-8 pb-5">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <h1 className="font-display text-3xl tracking-tight text-paper flex items-center gap-2">
              <CashStackIcon size={28} />
              cashapp
            </h1>
            <span className="text-xs tabular text-ink-600 uppercase tracking-widest">{dateStr}</span>
          </div>
          <nav className="flex gap-1 mt-6">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 text-sm rounded-t-md border-b-2 transition-colors ${
                  tab === t.id
                    ? 'border-gold text-paper bg-ink-900'
                    : 'border-transparent text-ink-600 hover:text-paper hover:bg-ink-900/50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'transactions' && <TransactionsPage />}
        {tab === 'subscriptions' && <SubscriptionsPage />}
      </main>

      <footer className="max-w-6xl mx-auto px-6 pb-10 pt-4 text-xs text-ink-600">
        cashapp — a small, honest way to see where your money goes.
      </footer>
    </div>
  )
}
