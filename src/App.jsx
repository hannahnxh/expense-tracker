import { useState } from 'react'
import Dashboard from './components/Dashboard.jsx'
import ActivityPage from './components/ActivityPage.jsx'
import SubscriptionsPage from './components/SubscriptionsPage.jsx'
import DataPage from './components/DataPage.jsx'
import AddTransactionSheet from './components/AddTransactionSheet.jsx'

const icon = (d) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
)

const TABS = [
  { id: 'overview', label: 'Overview', icon: icon(<><path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M22 20H2" /></>) },
  { id: 'activity', label: 'Activity', icon: icon(<><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /></>) },
  { id: 'subs', label: 'Subscriptions', icon: icon(<><path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 4v5h-5" /></>) },
  { id: 'data', label: 'Data', icon: icon(<><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" /><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></>) },
]

export default function App() {
  const [tab, setTab] = useState('overview')
  const [adding, setAdding] = useState(false)
  const showFab = tab === 'overview' || tab === 'activity'

  return (
    <div className="min-h-[100dvh] bg-ink-950 text-paper font-body">
      <header className="border-b border-ink-700/60" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-xl mx-auto px-5 py-4 flex items-baseline justify-between">
          <h1 className="font-display text-2xl tracking-tight">
            Ledger<span className="text-gold">.</span>
          </h1>
          <span className="text-xs text-ink-500">{TABS.find((t) => t.id === tab).label}</span>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-5 pt-5" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 140px)' }}>
        {tab === 'overview' && <Dashboard onAdd={() => setAdding(true)} />}
        {tab === 'activity' && <ActivityPage />}
        {tab === 'subs' && <SubscriptionsPage />}
        {tab === 'data' && <DataPage />}
      </main>

      {showFab && (
        <button
          onClick={() => setAdding(true)}
          aria-label="Add transaction"
          className="fixed right-5 z-30 w-14 h-14 rounded-full bg-gold text-ink-950 text-3xl leading-none shadow-card active:scale-95 transition-transform"
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 76px)' }}
        >
          +
        </button>
      )}

      <nav
        className="fixed bottom-0 inset-x-0 z-20 bg-ink-900/95 backdrop-blur border-t border-ink-700/70"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Main"
      >
        <div className="max-w-xl mx-auto grid grid-cols-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? 'page' : undefined}
              className={`flex flex-col items-center gap-1 py-2.5 text-[11px] ${tab === t.id ? 'text-gold' : 'text-ink-500'}`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {adding && <AddTransactionSheet onClose={() => setAdding(false)} />}
    </div>
  )
}
