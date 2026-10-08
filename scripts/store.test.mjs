import assert from 'node:assert/strict'
import {
  freshState, summarize, monthlyTrend, addCycle, rollSubscriptions, subscriptionTotals,
  daysUntil, validateImport, shiftMonth, makeFmt, dailySpend, heatLevel, daysInMonth,
} from '../src/lib/ledger.js'

const s = freshState()
const groceries = s.categories.find((c) => c.name === 'Groceries').id
const dining = s.categories.find((c) => c.name === 'Dining out').id

s.transactions = [
  { id: '1', type: 'income', amount: 3000, date: '2026-10-01', description: 'Pay' },
  { id: '2', type: 'expense', amount: 60, date: '2026-10-03', category_id: groceries },
  { id: '3', type: 'expense', amount: 40, date: '2026-10-04', category_id: dining },
  { id: '4', type: 'expense', amount: 20, date: '2026-10-05', category_id: null },
  { id: '5', type: 'saving', amount: 500, date: '2026-10-06', savings_destination: 'investment' },
  { id: '6', type: 'saving', amount: 300, date: '2026-10-06', savings_destination: 'bank' },
  { id: '7', type: 'expense', amount: 99, date: '2026-09-15', category_id: groceries },
]

// Dashboard math, month vs all-time
let o = summarize(s, '2026-10')
assert.equal(o.income, 3000)
assert.equal(o.expense, 120)
assert.equal(o.saved, 800)
assert.equal(o.leftOver, 2080)
assert.equal(o.savingsRate, 26.7)
assert.deepEqual(o.savings, { bank: 300, investment: 500 })
assert.equal(o.categoryBreakdown[0].name, 'Groceries')
assert.equal(o.categoryBreakdown.at(-1).name, 'Uncategorized')
assert.equal(summarize(s, 'all').expense, 219)
assert.equal(summarize(s, '2026-08').savingsRate, null)

// Deleted category falls back to Uncategorized
const s2 = { ...s, categories: s.categories.filter((c) => c.id !== dining) }
assert.ok(summarize(s2, '2026-10').categoryBreakdown.some((c) => c.name === 'Uncategorized' && c.total === 60))

// Trend
const trend = monthlyTrend(s, 6, new Date(2026, 9, 8))
assert.equal(trend.length, 6)
assert.equal(trend.at(-1).month, '2026-10')
assert.equal(trend.at(-2).expense, 99)
assert.equal(trend[0].month, '2026-05')

// Billing cycles incl. month-end clamping and year wrap
assert.equal(addCycle('2026-01-31', 'monthly'), '2026-02-28')
assert.equal(addCycle('2026-12-15', 'monthly'), '2027-01-15')
assert.equal(addCycle('2028-02-29', 'yearly'), '2029-02-28')
assert.equal(addCycle('2026-10-08', 'weekly'), '2026-10-15')

// Rolling past-due subscriptions forward; paused ones untouched
const withSubs = {
  ...s,
  subscriptions: [
    { id: 'a', name: 'Netflix', amount: 20, billing_cycle: 'monthly', next_billing_date: '2026-07-20', active: true },
    { id: 'b', name: 'Old', amount: 5, billing_cycle: 'monthly', next_billing_date: '2026-01-01', active: false },
    { id: 'c', name: 'Future', amount: 5, billing_cycle: 'yearly', next_billing_date: '2027-01-01', active: true },
  ],
}
const rolled = rollSubscriptions(withSubs, '2026-10-08')
assert.equal(rolled.subscriptions[0].next_billing_date, '2026-10-20')
assert.equal(rolled.subscriptions[1].next_billing_date, '2026-01-01')
assert.equal(rolled.subscriptions[2].next_billing_date, '2027-01-01')
assert.equal(rollSubscriptions(rolled, '2026-10-08'), rolled, 'no-op returns same object')

// Totals normalise to monthly
const t = subscriptionTotals({ subscriptions: [
  { amount: 12, billing_cycle: 'monthly', active: true },
  { amount: 120, billing_cycle: 'yearly', active: true },
  { amount: 3, billing_cycle: 'weekly', active: true },
  { amount: 999, billing_cycle: 'monthly', active: false },
] })
assert.equal(Math.round(t.monthly * 100) / 100, 12 + 10 + 13)
assert.equal(t.activeCount, 3)

assert.equal(daysUntil('2026-10-10', '2026-10-08'), 2)
assert.equal(daysUntil('2026-10-07', '2026-10-08'), -1)
assert.equal(shiftMonth('2026-01', -1), '2025-12')
assert.equal(shiftMonth('2026-12', 1), '2027-01')
assert.equal(makeFmt('SGD')(1234.5), '$1,234.50')

// Calendar: daily spending, offset, daily-average denominator
const cal = dailySpend(s, '2026-10', '2026-10-08')
assert.equal(cal.days.length, 31)
assert.equal(cal.offset, 3, '1 Oct 2026 is a Thursday')
assert.equal(cal.days[2].spent, 60)
assert.equal(cal.days[5].spent, 0, 'savings are not spending')
assert.equal(cal.days[5].items.length, 2)
assert.equal(cal.days[0].items.length, 1, 'income is listed on its day')
assert.equal(cal.max, 60)
assert.equal(cal.elapsed, 8)
assert.equal(dailySpend(s, '2026-09', '2026-10-08').elapsed, 30)
assert.equal(dailySpend(s, '2026-11', '2026-10-08').elapsed, 0)
assert.equal(daysInMonth('2028-02'), 29)
assert.equal(heatLevel(0, 60), 0)
assert.equal(heatLevel(60, 60), 4)
assert.equal(heatLevel(5, 60), 1)

// Backup round-trip + bad input
const restored = validateImport(JSON.stringify(withSubs))
assert.equal(restored.transactions.length, 7)
assert.throws(() => validateImport('not json'), /valid JSON/)
assert.throws(() => validateImport('{"hello":1}'), /Ledger backup/)

console.log('All store tests passed')
