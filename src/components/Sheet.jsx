import { useEffect } from 'react'

// Bottom sheet used for the add forms. Locks page scroll while open; Escape closes it.
export default function Sheet({ title, onClose, children }) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="Close" className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="sheet-enter relative w-full max-w-lg bg-ink-900 border-t border-ink-700 rounded-t-2xl max-h-[92dvh] overflow-y-auto"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="font-display text-xl">{title}</h2>
          <button onClick={onClose} className="text-sm text-ink-500 px-2 py-1 -mr-2">
            Cancel
          </button>
        </div>
        <div className="px-5 pb-2">{children}</div>
      </div>
    </div>
  )
}
