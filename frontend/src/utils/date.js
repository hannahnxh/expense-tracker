// Format a Date as YYYY-MM-DD using its *local* calendar date.
// (Date#toISOString() converts to UTC first, which silently shifts the
// date backward by a day for anyone in a timezone ahead of UTC.)
export function toLocalISODate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayLocalISODate() {
  return toLocalISODate(new Date())
}
