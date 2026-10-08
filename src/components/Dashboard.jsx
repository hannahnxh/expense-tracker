import { useMemo, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import { useLedger } from '../lib/store.js'
import {
  summarize, monthlyTrend, subscriptionTotals, daysUntil, makeFmt, monthTitle, monthShort, shiftMonth, today, monthKeyOf, dailySpend,
} from '../lib/ledger.js'
import StatCard from './StatCard.jsx'
import CalendarCard from './CalendarCard.jsx'
import { theme } from '../lib/theme.js'

const tooltipStyle = { background: theme.field, border: `1px solid ${theme.line}`, borderRadius: 8, color: theme.text, fontSize: 13 }
const card = 'bg-ink-900 border border-ink-700/70 rounded-xl p-5 shadow-card'

export default function Dashboard({ onAdd }) {
  const state = useLedger()
  const fmt = makeFmt(state.settings.currency)
  const thisMonth = monthKeyOf(today())
  const [period, setPeriod] = useState(thisMonth)

  const s = useMemo(() => summarize(state, period), [state, period])
  const trend = useMemo(() => monthlyTrend(state, 6).map((m) => ({ ...m, label: monthShort(m.month) })), [state])
  const subs = useMemo(() => subscriptionTotals(state), [state])
  const dueSoon = useMemo(
    () =>
      state.subscriptions
        .filter((x) => x.active && daysUntil(x.next_billing_date) <= 14)
        .sort((a, b) => a.next_billing_date.localeCompare(b.next_billing_date)),
    [state],
  )

  if (state.transactions.length === 0 && state.subscriptions.length === 0) {
    return (
      <div className={`${card} text-center py-10`}>
        <h2 className="font-display text-2xl mb-2">Start your ledger</h2>
        <p className="text-sm text-ink-500 max-w-xs mx-auto mb-6">
          Log your income, what you spend and what you put away. Everything stays on this phone.
        </p>
        <button onClick={onAdd} className="px-6 py-3 rounded-xl bg-gold text-ink-950 font-semibold">
          Add your first transaction
        </button>
      </div>
    )
  }

  const savingsTotal = s.savings.bank + s.savings.investment
  const isAll = period === 'all'
  const elapsed = isAll ? 0 : dailySpend(state, period).elapsed
  const perDay = elapsed > 0 ? s.expense / elapsed : null

  return (
    <div className="space-y-5">
      {isAll ? (
        <>
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-xl">All time</h2>
            <button
              onClick={() => setPeriod(thisMonth)}
              className="text-sm px-3 py-2 rounded-lg border border-ink-700 text-ink-500 active:bg-ink-800"
            >
              By month
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Income" value={fmt(s.income)} accent="text-moss-400" />
            <StatCard label="Spent" value={fmt(s.expense)} accent="text-rust-400" />
            <StatCard
              label="Saved"
              value={fmt(s.saved)}
              accent="text-gold"
              sub={s.savingsRate === null ? 'No income logged' : `${s.savingsRate}% of income`}
            />
            <StatCard
              label="Left over"
              value={fmt(s.leftOver)}
              accent={s.leftOver >= 0 ? 'text-paper' : 'text-rust-400'}
              sub="Income − spent − saved"
            />
          </div>
        </>
      ) : (
        <>
          {/* Headline: spending this month and the daily average */}
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-ink-500">
                Spent in {monthTitle(period).split(' ')[0]}
                {period === thisMonth ? ' so far' : ''}
              </p>
              <p className="font-display text-[34px] leading-tight tabular text-rust-400 truncate">{fmt(s.expense)}</p>
              <p className="text-xs text-ink-500 mt-0.5">{perDay === null ? 'Month not started' : `${fmt(perDay)} a day on average`}</p>
            </div>
            <button
              onClick={() => setPeriod('all')}
              className="text-sm px-3 py-2 rounded-lg border border-ink-700 text-ink-500 active:bg-ink-800 shrink-0"
            >
              All time
            </button>
          </div>

          <CalendarCard
            state={state}
            period={period}
            fmt={fmt}
            onPrev={() => setPeriod(shiftMonth(period, -1))}
            onNext={() => setPeriod(shiftMonth(period, 1))}
            canNext={period < thisMonth}
          />

          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Income"
              value={fmt(s.income)}
              accent="text-moss-400"
              sub={`${fmt(s.leftOver)} left over`}
            />
            <StatCard
              label="Saved"
              value={fmt(s.saved)}
              accent="text-gold"
              sub={s.savingsRate === null ? 'No income logged' : `${s.savingsRate}% of income`}
            />
          </div>
        </>
      )}

      {/* Category breakdown */}
      <section className={card} aria-labelledby="cat-h">
        <div className="flex items-baseline justify-between mb-4">
          <h2 id="cat-h" className="font-display text-lg">
            Spending by category
          </h2>
          <span className="text-xs text-ink-500 tabular">{fmt(s.expense)}</span>
        </div>
        {s.categoryBreakdown.length === 0 ? (
          <p className="text-sm text-ink-500 py-4 text-center">No spending in this period.</p>
        ) : (
          <>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie isAnimationActive={false} data={s.categoryBreakdown} dataKey="total" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2} stroke={theme.surface} strokeWidth={2}>
                    {s.categoryBreakdown.map((c) => (
                      <Cell key={c.id} fill={c.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} contentStyle={tooltipStyle} itemStyle={{ color: theme.text }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="ledger-lines mt-3">
              {s.categoryBreakdown.map((c) => (
                <li key={c.id} className="flex items-center justify-between h-9 text-sm">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="truncate">{c.name}</span>
                  </span>
                  <span className="flex items-center gap-3 tabular shrink-0">
                    <span className="text-ink-500 w-12 text-right">{c.percentage}%</span>
                    <span className="w-24 text-right">{fmt(c.total)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* Savings */}
      <section className={card} aria-labelledby="sav-h">
        <div className="flex items-baseline justify-between mb-4">
          <h2 id="sav-h" className="font-display text-lg">
            Where your savings went
          </h2>
          <span className="text-xs text-ink-500 tabular">{fmt(savingsTotal)}</span>
        </div>
        {savingsTotal === 0 ? (
          <p className="text-sm text-ink-500">Add a “Saving” transaction and pick bank savings or investments to see the split.</p>
        ) : (
          <div className="space-y-4">
            {[
              ['Bank savings', s.savings.bank],
              ['Investments', s.savings.investment],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span>{label}</span>
                  <span className="tabular">
                    {fmt(value)} <span className="text-ink-500">· {Math.round((value / savingsTotal) * 100)}%</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-ink-700 overflow-hidden">
                  <div className="h-full bg-gold rounded-full" style={{ width: `${(value / savingsTotal) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Subscriptions */}
      <section className={card} aria-labelledby="sub-h">
        <h2 id="sub-h" className="font-display text-lg mb-2">
          Subscriptions
        </h2>
        <p className="font-display text-3xl tabular text-amber-400">
          {fmt(subs.monthly)}
          <span className="text-sm text-ink-500 font-body"> / month</span>
        </p>
        <p className="text-xs text-ink-500 mt-1">
          {subs.activeCount} active · {fmt(subs.yearly)} / year
        </p>
        {dueSoon.length > 0 && (
          <div className="mt-4 border-t border-ink-700/70 pt-3">
            <p className="text-[11px] uppercase tracking-widest text-ink-500 mb-1">Due in the next 2 weeks</p>
            {dueSoon.slice(0, 5).map((x) => {
              const d = daysUntil(x.next_billing_date)
              return (
                <div key={x.id} className="flex justify-between text-sm py-1.5">
                  <span className="truncate pr-3">{x.name}</span>
                  <span className="tabular text-ink-500 shrink-0">
                    {fmt(x.amount)} · {d === 0 ? 'today' : d === 1 ? 'tomorrow' : `in ${d} days`}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Trend */}
      <section className={card} aria-labelledby="trend-h">
        <h2 id="trend-h" className="font-display text-lg mb-4">
          Last 6 months
        </h2>
        <div className="h-56 -ml-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.line} vertical={false} />
              <XAxis dataKey="label" stroke={theme.line} tick={{ fill: theme.muted, fontSize: 12 }} />
              <YAxis stroke={theme.line} tick={{ fill: theme.muted, fontSize: 12 }} width={48} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : v)} />
              <Tooltip formatter={(v) => fmt(v)} contentStyle={tooltipStyle} cursor={{ fill: 'rgba(232,237,247,0.04)' }} />
              <Legend wrapperStyle={{ fontSize: 12, color: theme.muted }} />
              <Bar isAnimationActive={false} dataKey="income" name="Income" fill={theme.incomeBar} radius={[3, 3, 0, 0]} />
              <Bar isAnimationActive={false} dataKey="expense" name="Spent" fill={theme.spentBar} radius={[3, 3, 0, 0]} />
              <Bar isAnimationActive={false} dataKey="saved" name="Saved" fill={theme.accent} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  )
}
