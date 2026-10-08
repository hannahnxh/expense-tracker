// Pure ledger logic — no React, no browser APIs — so it can be tested in Node.

export const DEFAULT_CATEGORIES = [
  ['Groceries', '#4C9A79'],
  ['Rent / Mortgage', '#8B5E3C'],
  ['Transport', '#3E7CB1'],
  ['Dining out', '#D98E4A'],
  ['Entertainment', '#A45FBF'],
  ['Utilities', '#5C7AEA'],
  ['Health', '#E15B64'],
  ['Shopping', '#E0B84B'],
  ['Travel', '#4FB3BF'],
  ['Other', '#9CA3AF'],
]

export const CURRENCIES = ['SGD', 'USD', 'EUR', 'GBP', 'MYR', 'AUD', 'JPY']

const pad = (n) => String(n).padStart(2, '0')

// Local-time YYYY-MM-DD. (toISOString() is UTC and can be off by a day.)
export const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const today = () => toDateStr(new Date())
export const monthKeyOf = (dateStr) => dateStr.slice(0, 7)

export function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function freshState() {
  return {
    version: 1,
    settings: { currency: 'SGD' },
    categories: DEFAULT_CATEGORIES.map(([name, color]) => ({ id: uid(), name, color })),
    transactions: [],
    subscriptions: [],
  }
}

// ---------- Subscriptions ----------

function addMonths(y, m, d, n) {
  const target = new Date(y, m - 1 + n, 1)
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  return new Date(target.getFullYear(), target.getMonth(), Math.min(d, last))
}

export function addCycle(dateStr, cycle) {
  const [y, m, d] = dateStr.split('-').map(Number)
  if (cycle === 'weekly') return toDateStr(new Date(y, m - 1, d + 7))
  if (cycle === 'yearly') return toDateStr(addMonths(y, m, d, 12))
  return toDateStr(addMonths(y, m, d, 1))
}

// Move any active subscription whose billing date has passed forward to its next
// upcoming date. Returns the same state object if nothing changed.
export function rollSubscriptions(state, todayStr = today()) {
  let changed = false
  const subscriptions = state.subscriptions.map((s) => {
    if (!s.active) return s
    let next = s.next_billing_date
    let guard = 0
    while (next < todayStr && guard++ < 1000) next = addCycle(next, s.billing_cycle)
    if (next === s.next_billing_date) return s
    changed = true
    return { ...s, next_billing_date: next }
  })
  return changed ? { ...state, subscriptions } : state
}

export function monthlyEquivalent(amount, cycle) {
  if (cycle === 'yearly') return amount / 12
  if (cycle === 'weekly') return (amount * 52) / 12
  return amount
}

export function subscriptionTotals(state) {
  const active = state.subscriptions.filter((s) => s.active)
  const monthly = active.reduce((sum, s) => sum + monthlyEquivalent(s.amount, s.billing_cycle), 0)
  return { monthly, yearly: monthly * 12, activeCount: active.length }
}

export function daysUntil(dateStr, todayStr = today()) {
  const [y1, m1, d1] = dateStr.split('-').map(Number)
  const [y2, m2, d2] = todayStr.split('-').map(Number)
  return Math.round((Date.UTC(y1, m1 - 1, d1) - Date.UTC(y2, m2 - 1, d2)) / 86400000)
}

// ---------- Dashboard ----------

const round2 = (n) => Math.round(n * 100) / 100

// period: 'all' or 'YYYY-MM'
export function summarize(state, period = 'all') {
  const txns = period === 'all' ? state.transactions : state.transactions.filter((t) => t.date.startsWith(period))
  const catById = new Map(state.categories.map((c) => [c.id, c]))

  let income = 0
  let expense = 0
  let saved = 0
  const byCategory = new Map()
  const byDestination = { bank: 0, investment: 0 }

  for (const t of txns) {
    if (t.type === 'income') income += t.amount
    else if (t.type === 'expense') {
      expense += t.amount
      const key = t.category_id && catById.has(t.category_id) ? t.category_id : 'none'
      byCategory.set(key, (byCategory.get(key) || 0) + t.amount)
    } else if (t.type === 'saving') {
      saved += t.amount
      const dest = t.savings_destination === 'investment' ? 'investment' : 'bank'
      byDestination[dest] += t.amount
    }
  }

  const categoryBreakdown = [...byCategory.entries()]
    .map(([key, total]) => {
      const cat = catById.get(key)
      return {
        id: key,
        name: cat ? cat.name : 'Uncategorized',
        color: cat ? cat.color : '#9CA3AF',
        total: round2(total),
        percentage: expense > 0 ? Math.round((total / expense) * 1000) / 10 : 0,
      }
    })
    .sort((a, b) => b.total - a.total)

  return {
    income: round2(income),
    expense: round2(expense),
    saved: round2(saved),
    leftOver: round2(income - expense - saved),
    savingsRate: income > 0 ? Math.round((saved / income) * 1000) / 10 : null,
    categoryBreakdown,
    savings: { bank: round2(byDestination.bank), investment: round2(byDestination.investment) },
  }
}

export function monthlyTrend(state, months = 6, now = new Date()) {
  const keys = []
  let y = now.getFullYear()
  let m = now.getMonth() + 1
  for (let i = 0; i < months; i++) {
    keys.push(`${y}-${pad(m)}`)
    m -= 1
    if (m === 0) {
      m = 12
      y -= 1
    }
  }
  keys.reverse()
  const rows = new Map(keys.map((k) => [k, { month: k, income: 0, expense: 0, saved: 0 }]))
  for (const t of state.transactions) {
    const row = rows.get(monthKeyOf(t.date))
    if (!row) continue
    if (t.type === 'income') row.income += t.amount
    else if (t.type === 'expense') row.expense += t.amount
    else if (t.type === 'saving') row.saved += t.amount
  }
  return keys.map((k) => {
    const r = rows.get(k)
    return { ...r, income: round2(r.income), expense: round2(r.expense), saved: round2(r.saved) }
  })
}

export function daysInMonth(key) {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

// Calendar data for one month ('YYYY-MM'): one entry per day with that day's
// spending total and its transactions, plus how many days count towards the
// daily average (days so far for the current month, the whole month otherwise).
export function dailySpend(state, key, todayStr = today()) {
  const count = daysInMonth(key)
  const days = Array.from({ length: count }, (_, i) => ({ day: i + 1, date: `${key}-${pad(i + 1)}`, spent: 0, items: [] }))
  for (const t of state.transactions) {
    if (!t.date.startsWith(key)) continue
    const d = days[Number(t.date.slice(8, 10)) - 1]
    if (!d) continue
    d.items.push(t)
    if (t.type === 'expense') d.spent += t.amount
  }
  for (const d of days) d.spent = round2(d.spent)
  const thisMonth = monthKeyOf(todayStr)
  const elapsed = key < thisMonth ? count : key === thisMonth ? Number(todayStr.slice(8, 10)) : 0
  const max = Math.max(0, ...days.map((d) => d.spent))
  // Monday = 0 … Sunday = 6, for the blank cells before the 1st
  const [y, m] = key.split('-').map(Number)
  const offset = (new Date(y, m - 1, 1).getDay() + 6) % 7
  return { days, elapsed, max, offset }
}

// 0–4 shading level for a day, relative to the month's biggest day.
export function heatLevel(spent, max) {
  if (spent <= 0 || max <= 0) return 0
  const r = spent / max
  return r < 0.15 ? 1 : r < 0.35 ? 2 : r < 0.65 ? 3 : 4
}

export function shiftMonth(key, delta) {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

export function monthTitle(key) {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-SG', { month: 'long', year: 'numeric' })
}

export function monthShort(key) {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-SG', { month: 'short' })
}

export function makeFmt(currency = 'SGD') {
  let nf
  try {
    nf = new Intl.NumberFormat('en-SG', { style: 'currency', currency })
  } catch {
    nf = new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD' })
  }
  return (n) => nf.format(Number(n) || 0)
}

// ---------- Backup / restore ----------

export function validateImport(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error("That file isn't valid JSON.")
  }
  if (!data || typeof data !== 'object' || !Array.isArray(data.transactions) || !Array.isArray(data.subscriptions) || !Array.isArray(data.categories)) {
    throw new Error("That file doesn't look like a Ledger backup.")
  }
  return {
    version: 1,
    settings: { currency: data.settings?.currency || 'SGD' },
    categories: data.categories,
    transactions: data.transactions,
    subscriptions: data.subscriptions,
  }
}
