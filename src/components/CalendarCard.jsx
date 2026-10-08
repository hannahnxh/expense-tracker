import { useMemo, useState } from 'react'
import { theme } from '../lib/theme.js'
import { dailySpend, heatLevel, monthTitle, today, monthKeyOf } from '../lib/ledger.js'

const card = 'bg-ink-900 border border-ink-700/70 rounded-xl shadow-card'
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
// Opacity of the spending colour for heat levels 1–4
const HEAT = [0, 0.25, 0.45, 0.7, 1]

function dayTitle(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-SG', { weekday: 'long', day: 'numeric', month: 'long' })
}

function describe(t, catById) {
  if (t.type === 'income') return { label: 'Income', color: theme.incomeBar, amountClass: 'text-moss-400', sign: '+' }
  if (t.type === 'saving') {
    return { label: t.savings_destination === 'investment' ? 'Investments' : 'Bank savings', color: theme.accent, amountClass: 'text-gold', sign: '+' }
  }
  const cat = catById.get(t.category_id)
  return { label: cat?.name || 'Uncategorized', color: cat?.color || '#9CA3AF', amountClass: 'text-paper', sign: '−' }
}

// Month calendar shaded by daily spending, with the tapped day's transactions underneath.
// `period` is 'YYYY-MM'; onPrev/onNext move between months.
export default function CalendarCard({ state, period, fmt, onPrev, onNext, canNext }) {
  const todayStr = today()
  const isThisMonth = period === monthKeyOf(todayStr)
  const cal = useMemo(() => dailySpend(state, period, todayStr), [state, period, todayStr])
  const catById = useMemo(() => new Map(state.categories.map((c) => [c.id, c])), [state.categories])
  const [picked, setPicked] = useState({ period, day: isThisMonth ? Number(todayStr.slice(8, 10)) : null })
  // Reset the selection when the month changes
  const selectedDay = picked.period === period ? picked.day : isThisMonth ? Number(todayStr.slice(8, 10)) : null
  const selected = selectedDay ? cal.days[selectedDay - 1] : null

  return (
    <>
      <section className={`${card} p-4`} aria-labelledby="cal-h">
        <div className="flex items-center justify-between mb-3">
          <button aria-label="Previous month" onClick={onPrev} className="w-10 h-10 rounded-lg text-xl text-ink-500 active:bg-ink-800">
            ‹
          </button>
          <h2 id="cal-h" className="font-display text-lg">
            {monthTitle(period)}
          </h2>
          <button aria-label="Next month" onClick={onNext} disabled={!canNext} className="w-10 h-10 rounded-lg text-xl text-ink-500 disabled:opacity-30 active:bg-ink-800">
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-[5px] text-center text-[11px] text-ink-500 mb-1.5" aria-hidden="true">
          {WEEKDAYS.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-[5px]">
          {Array.from({ length: cal.offset }, (_, i) => (
            <span key={`blank-${i}`} />
          ))}
          {cal.days.map((d) => {
            const future = d.date > todayStr
            const level = future ? 0 : heatLevel(d.spent, cal.max)
            const isSelected = selectedDay === d.day
            const isToday = d.date === todayStr
            return (
              <button
                key={d.day}
                disabled={future}
                onClick={() => setPicked({ period, day: d.day })}
                aria-pressed={isSelected}
                aria-label={`${dayTitle(d.date)}, ${future ? 'upcoming' : `${fmt(d.spent)} spent`}`}
                className={`relative h-11 rounded-lg overflow-hidden text-[13px] tabular ${future ? 'text-ink-600' : 'bg-ink-800'} ${
                  isSelected ? 'ring-2 ring-paper' : isToday ? 'ring-1 ring-gold' : ''
                } ${level >= 3 ? 'text-white' : ''}`}
              >
                <span className="absolute inset-0 bg-rust-500" style={{ opacity: HEAT[level] }} aria-hidden="true" />
                <span className="relative">{d.day}</span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center justify-end gap-1 mt-3 text-[11px] text-ink-500" aria-hidden="true">
          <span className="mr-1">Less</span>
          <span className="w-3.5 h-3.5 rounded-[3px] bg-ink-800" />
          {HEAT.slice(1).map((o) => (
            <span key={o} className="w-3.5 h-3.5 rounded-[3px] bg-rust-500" style={{ opacity: o }} />
          ))}
          <span className="ml-1">More</span>
        </div>
      </section>

      <section className={`${card} px-5 py-4`} aria-live="polite">
        {!selected ? (
          <p className="text-sm text-ink-500 text-center py-2">Tap a day to see what you spent.</p>
        ) : (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-display text-[17px]">
                {dayTitle(selected.date)}
                {selected.date === todayStr && <span className="text-ink-500 font-body text-sm"> · Today</span>}
              </h3>
              <span className="tabular text-[15px] font-medium text-rust-400 shrink-0">
                {selected.spent > 0 ? fmt(selected.spent) : 'No spending'}
              </span>
            </div>
            {selected.items.length > 0 && (
              <ul className="mt-2.5">
                {selected.items.map((t) => {
                  const d = describe(t, catById)
                  return (
                    <li key={t.id} className="flex items-center justify-between gap-3 py-2 border-t border-ink-700/60 text-sm">
                      <span className="flex items-center gap-2.5 min-w-0">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="min-w-0">
                          <span className="block truncate">{d.label}</span>
                          {t.description && <span className="block text-xs text-ink-500 truncate">{t.description}</span>}
                        </span>
                      </span>
                      <span className={`tabular shrink-0 ${d.amountClass}`}>
                        {d.sign}
                        {fmt(t.amount)}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </>
        )}
      </section>
    </>
  )
}
