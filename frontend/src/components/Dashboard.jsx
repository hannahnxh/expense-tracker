import { useEffect, useState } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'
import { api } from '../api.js'
import StatCard from './StatCard.jsx'

const fmt = (n) => `$${Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const monthLabel = (mk) => {
  const [y, m] = mk.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(undefined, { month: 'short' })
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [subSummary, setSubSummary] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([api.getDashboardSummary({ months: 6 }), api.getSubscriptionsSummary()])
      .then(([s, sub]) => {
        setSummary(s)
        setSubSummary(sub)
      })
      .catch((e) => setError(e.message))
  }, [])

  if (error) {
    return (
      <div className="bg-rust-500/10 border border-rust-500/40 text-rust-400 rounded-lg px-5 py-4">
        Couldn't reach the API: {error}. Make sure VITE_API_URL points at your backend.
      </div>
    )
  }

  if (!summary) {
    return <div className="text-ink-600 text-sm">Loading your numbers…</div>
  }

  const hasExpenses = summary.category_breakdown.length > 0
  const savingsTotal = summary.savings_breakdown.reduce((a, b) => a + b.total, 0)

  return (
    <div className="space-y-8">
      {/* Top-line stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Income" value={fmt(summary.total_income)} accent="text-moss-400" />
        <StatCard label="Spent" value={fmt(summary.total_expense)} accent="text-rust-400" />
        <StatCard label="Saved / Invested" value={fmt(summary.total_saved)} accent="text-gold" />
        <StatCard
          label="Net"
          value={fmt(summary.net)}
          accent={summary.net >= 0 ? 'text-moss-400' : 'text-rust-400'}
          sub="Income − spend − saved"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Category ledger + donut */}
        <div className="lg:col-span-3 bg-ink-900 border border-ink-700/60 rounded-lg p-6 shadow-card">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-lg">Spending by category</h2>
            <span className="text-xs text-ink-600 tabular">{fmt(summary.total_expense)} total</span>
          </div>

          {!hasExpenses ? (
            <p className="text-sm text-ink-600 py-8 text-center">
              No expenses logged yet. Add one from the Transactions tab.
            </p>
          ) : (
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="w-full md:w-48 h-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summary.category_breakdown}
                      dataKey="total"
                      nameKey="category_name"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {summary.category_breakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="#12181B" strokeWidth={1} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => fmt(value)}
                      contentStyle={{ background: '#1E272C', border: '1px solid #3A4950', borderRadius: 8, color: '#F4F1EA' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Ledger-style rows */}
              <div className="w-full ledger-lines">
                {summary.category_breakdown.map((c) => (
                  <div key={c.category_id ?? 'none'} className="flex items-center justify-between py-1.5 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="truncate">{c.category_name}</span>
                    </div>
                    <div className="flex items-center gap-3 tabular shrink-0">
                      <span className="text-ink-600 w-10 text-right">{c.percentage}%</span>
                      <span className="w-20 text-right">{fmt(c.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Savings + subscriptions */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-ink-900 border border-ink-700/60 rounded-lg p-6 shadow-card">
            <h2 className="font-display text-lg mb-4">Where your savings sit</h2>
            {savingsTotal === 0 ? (
              <p className="text-sm text-ink-600">
                Log a "saving" transaction and mark it as Bank or Investment to see it here.
              </p>
            ) : (
              <div className="space-y-3">
                {summary.savings_breakdown.map((s) => {
                  const pct = savingsTotal > 0 ? (s.total / savingsTotal) * 100 : 0
                  return (
                    <div key={s.destination}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize">{s.destination}</span>
                        <span className="tabular">{fmt(s.total)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-ink-700 overflow-hidden">
                        <div
                          className="h-full bg-gold rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="bg-ink-900 border border-ink-700/60 rounded-lg p-6 shadow-card">
            <h2 className="font-display text-lg mb-2">Subscriptions</h2>
            <p className="text-3xl font-display tabular text-amber-400">
              {fmt(summary.subscription_monthly_cost)}
              <span className="text-sm text-ink-600 font-body"> / month</span>
            </p>
            <p className="text-xs text-ink-600 mt-1">
              {subSummary?.active_count ?? 0} active · {fmt(subSummary?.yearly_total ?? 0)} / year
            </p>
            {subSummary?.upcoming?.length > 0 && (
              <div className="mt-4 border-t border-ink-700/60 pt-3">
                <p className="text-xs uppercase tracking-widest text-ink-600 mb-2">Due within 2 weeks</p>
                {subSummary.upcoming.slice(0, 4).map((s) => (
                  <div key={s.id} className="flex justify-between text-sm py-1">
                    <span>{s.name}</span>
                    <span className="tabular text-ink-600">{s.next_billing_date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monthly trend */}
      <div className="bg-ink-900 border border-ink-700/60 rounded-lg p-6 shadow-card">
        <h2 className="font-display text-lg mb-4">Last 6 months</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary.monthly_trend.map((m) => ({ ...m, label: monthLabel(m.month) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A363C" vertical={false} />
              <XAxis dataKey="label" stroke="#3A4950" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <YAxis stroke="#3A4950" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <Tooltip
                formatter={(value) => fmt(value)}
                contentStyle={{ background: '#1E272C', border: '1px solid #3A4950', borderRadius: 8, color: '#F4F1EA' }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: '#9CA3AF' }} />
              <Bar dataKey="income" name="Income" fill="#4C9A79" radius={[3, 3, 0, 0]} />
              <Bar dataKey="expense" name="Spent" fill="#C85A4C" radius={[3, 3, 0, 0]} />
              <Bar dataKey="saved" name="Saved" fill="#C9A15C" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
