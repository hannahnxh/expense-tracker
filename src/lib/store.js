import { useSyncExternalStore } from 'react'
import { freshState, rollSubscriptions, uid, validateImport, today } from './ledger.js'

const KEY = 'ledger.v1'

function load() {
  let state
  try {
    const raw = localStorage.getItem(KEY)
    state = raw ? validateImport(raw) : freshState()
  } catch (e) {
    console.warn('Could not read saved data, starting fresh', e)
    state = freshState()
  }
  return rollSubscriptions(state)
}

let state = load()
const listeners = new Set()

function commit(next) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch (e) {
    console.error('Could not save data', e)
    alert("Ledger couldn't save to this device (storage may be full or blocked).")
  }
  listeners.forEach((l) => l())
}

// Ask the browser not to evict our data under storage pressure.
if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
  navigator.storage.persist().catch(() => {})
}

// Re-roll subscription dates when the app is reopened after being backgrounded.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return
    const rolled = rollSubscriptions(state)
    if (rolled !== state) commit(rolled)
    else listeners.forEach((l) => l())
  })
}

const subscribe = (l) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const useLedger = () => useSyncExternalStore(subscribe, () => state)

export const actions = {
  addTransaction(t) {
    commit({ ...state, transactions: [{ id: uid(), ...t }, ...state.transactions] })
  },
  deleteTransaction(id) {
    commit({ ...state, transactions: state.transactions.filter((t) => t.id !== id) })
  },
  addSubscription(s) {
    commit({ ...state, subscriptions: [...state.subscriptions, { id: uid(), active: true, ...s }] })
  },
  toggleSubscription(id) {
    // Resuming a paused subscription whose date has passed moves it to its next upcoming date.
    commit(
      rollSubscriptions({
        ...state,
        subscriptions: state.subscriptions.map((s) => (s.id === id ? { ...s, active: !s.active } : s)),
      }),
    )
  },
  deleteSubscription(id) {
    commit({ ...state, subscriptions: state.subscriptions.filter((s) => s.id !== id) })
  },
  addCategory(name, color) {
    commit({ ...state, categories: [...state.categories, { id: uid(), name: name.trim(), color }] })
  },
  deleteCategory(id) {
    commit({
      ...state,
      categories: state.categories.filter((c) => c.id !== id),
      transactions: state.transactions.map((t) => (t.category_id === id ? { ...t, category_id: null } : t)),
      subscriptions: state.subscriptions.map((s) => (s.category_id === id ? { ...s, category_id: null } : s)),
    })
  },
  setCurrency(currency) {
    commit({ ...state, settings: { ...state.settings, currency } })
  },
  exportText() {
    return JSON.stringify(state, null, 2)
  },
  importText(text) {
    commit(rollSubscriptions(validateImport(text)))
  },
  resetAll() {
    commit(freshState())
  },
}

export { today }
