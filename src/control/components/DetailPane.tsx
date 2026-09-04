import type { ReactNode } from 'react'

interface DetailPaneProps {
  open: boolean
  /** Final width in px. */
  width?: number
  children: ReactNode
}

/**
 * Right-hand detail panel for library dialogs. Grows from 0 to `width`
 * while the list on the left keeps its size; since the dialog is centered
 * in the overlay, the list slides left as the panel opens.
 */
export function DetailPane({ open, width = 400, children }: DetailPaneProps) {
  return (
    <div
      aria-hidden={!open}
      className="shrink-0 overflow-hidden transition-[width] duration-300 ease-out"
      style={{ width: open ? width : 0 }}
    >
      <div className="flex h-full flex-col border-l border-white/8" style={{ width }}>
        {children}
      </div>
    </div>
  )
}
