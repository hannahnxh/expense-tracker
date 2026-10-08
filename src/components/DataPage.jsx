import { useRef, useState } from 'react'
import { useLedger, actions } from '../lib/store.js'
import { CURRENCIES, today } from '../lib/ledger.js'

const card = 'bg-ink-900 border border-ink-700/70 rounded-xl p-5 shadow-card'
const btn = 'px-4 py-3 rounded-xl border border-ink-700 text-sm font-medium active:bg-ink-800'
const LAST_BACKUP = 'ledger.lastBackup'

function readLastBackup() {
  try {
    return localStorage.getItem(LAST_BACKUP)
  } catch {
    return null
  }
}

export default function DataPage() {
  const state = useLedger()
  const fileRef = useRef(null)
  const [message, setMessage] = useState(null)
  const [lastBackup, setLastBackup] = useState(readLastBackup())
  const [catName, setCatName] = useState('')
  const [catColor, setCatColor] = useState('#4C9A79')

  const note = (text, ok = true) => setMessage({ text, ok })

  const markBackup = () => {
    const d = today()
    try {
      localStorage.setItem(LAST_BACKUP, d)
    } catch {
      /* ignore */
    }
    setLastBackup(d)
  }

  const exportBackup = async () => {
    const name = `ledger-backup-${today()}.json`
    const file = new File([actions.exportText()], name, { type: 'application/json' })
    // On iPhone the share sheet lets you save to Files, iCloud Drive, AirDrop, etc.
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Ledger backup' })
        markBackup()
        note('Backup shared.')
        return
      } catch (e) {
        if (e?.name === 'AbortError') return
      }
    }
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    markBackup()
    note('Backup downloaded.')
  }

  const importBackup = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      if (!window.confirm('Replace everything in Ledger with this backup? This cannot be undone.')) return
      actions.importText(text)
      note('Backup restored.')
    } catch (err) {
      note(err.message || 'Could not read that file.', false)
    }
  }

  const reset = () => {
    if (window.confirm('Delete all transactions, subscriptions and custom categories from this device?')) {
      actions.resetAll()
      note('Ledger was reset.')
    }
  }

  const addCategory = (e) => {
    e.preventDefault()
    const name = catName.trim()
    if (!name) return
    if (state.categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      note(`You already have a category called ${name}.`, false)
      return
    }
    actions.addCategory(name, catColor)
    setCatName('')
    setMessage(null)
  }

  return (
    <div className="space-y-5">
      <section className={card}>
        <h2 className="font-display text-lg mb-1">Back up your data</h2>
        <p className="text-sm text-ink-500 mb-4">
          Ledger keeps everything on this phone only. Nothing is uploaded, which also means deleting the app or clearing Safari data erases it. Save a backup file now and then.
        </p>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportBackup} className={`${btn} bg-gold text-ink-950 border-gold`}>
            Export backup
          </button>
          <button onClick={() => fileRef.current?.click()} className={btn}>
            Restore from file
          </button>
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={importBackup} />
        </div>
        <p className="text-xs text-ink-500 mt-3">Last backup: {lastBackup || 'never'}</p>
        {message && (
          <p role="status" className={`text-sm mt-3 ${message.ok ? 'text-moss-400' : 'text-rust-400'}`}>
            {message.text}
          </p>
        )}
      </section>

      <section className={card}>
        <h2 className="font-display text-lg mb-3">Currency</h2>
        <select
          value={state.settings.currency}
          onChange={(e) => actions.setCurrency(e.target.value)}
          className="w-full bg-ink-800 border border-ink-700 rounded-lg px-3 py-3 focus:outline-none focus:border-gold"
          aria-label="Currency"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <p className="text-xs text-ink-500 mt-2">Only changes how amounts are shown. Existing amounts aren’t converted.</p>
      </section>

      <section className={card}>
        <h2 className="font-display text-lg mb-3">Categories</h2>
        <ul className="divide-y divide-ink-700/60 mb-4">
          {state.categories.map((c) => (
            <li key={c.id} className="flex items-center justify-between py-2.5 text-sm">
              <span className="flex items-center gap-2.5 min-w-0">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                <span className="truncate">{c.name}</span>
              </span>
              <button
                onClick={() => window.confirm(`Delete ${c.name}? Its transactions become Uncategorized.`) && actions.deleteCategory(c.id)}
                className="text-ink-500 text-xs px-2 py-1.5 active:text-rust-400"
                aria-label={`Delete ${c.name}`}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
        <form onSubmit={addCategory} className="flex gap-2">
          <input
            type="color"
            value={catColor}
            onChange={(e) => setCatColor(e.target.value)}
            aria-label="Category colour"
            className="h-12 w-12 rounded-lg bg-ink-800 border border-ink-700 p-1 shrink-0"
          />
          <input
            type="text"
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            placeholder="New category"
            className="flex-1 min-w-0 bg-ink-800 border border-ink-700 rounded-lg px-3 py-3 focus:outline-none focus:border-gold"
          />
          <button type="submit" className={btn}>
            Add
          </button>
        </form>
      </section>

      <section className={card}>
        <h2 className="font-display text-lg mb-1">Reset</h2>
        <p className="text-sm text-ink-500 mb-3">Wipes all data on this device. Export a backup first if you might want it back.</p>
        <button onClick={reset} className={`${btn} text-rust-400 border-rust-500/40`}>
          Delete everything
        </button>
      </section>
    </div>
  )
}
