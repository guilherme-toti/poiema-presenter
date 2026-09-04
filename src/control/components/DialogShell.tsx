import { useEffect, type ReactNode } from 'react'
import { Minus, Square, X } from 'lucide-react'

interface DialogShellProps {
  title: string
  titleId: string
  /** Sizing classes for the dialog box: width (or `w-auto` for content-sized) and height. */
  className: string
  onClose: () => void
  children: ReactNode
}

/**
 * Centered modal with the app's fake window chrome (title + window buttons).
 * Closes on Escape, on backdrop click and on the ✕ button.
 */
export function DialogShell({ title, titleId, className, onClose, children }: DialogShellProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-8"
      onPointerDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onPointerDown={(e) => e.stopPropagation()}
        className={`flex flex-col overflow-hidden rounded-lg border border-white/10 bg-neutral-900 shadow-2xl shadow-black/60 ${className}`}
      >
        <div className="flex h-9 shrink-0 items-center justify-between border-b border-white/8 px-3">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-indigo-500" />
            <span id={titleId} className="text-xs font-semibold text-neutral-200">
              {title}
            </span>
          </div>
          <div className="flex items-center gap-1 text-neutral-500">
            <span className="flex h-6 w-6 items-center justify-center">
              <Minus className="h-3.5 w-3.5" />
            </span>
            <span className="flex h-6 w-6 items-center justify-center">
              <Square className="h-3 w-3" />
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="flex h-6 w-6 items-center justify-center rounded hover:bg-red-500/80 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
