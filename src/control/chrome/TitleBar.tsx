import type { MouseEvent } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { Minus, Square, X } from 'lucide-react'

const appWindow = getCurrentWindow()

// Tauri's built-in double-click handler on drag regions calls
// `internal_toggle_maximize`, which on macOS only maximizes when the window
// has an enabled native zoom button — never true for an undecorated window.
// So it can unmaximize but not re-maximize. We take over the double-click
// ourselves (stopping the event before Tauri's document listener sees it)
// and use the public toggle, which has no such gate.
function onTitleBarMouseUp(e: MouseEvent<HTMLDivElement>) {
  if (e.button !== 0 || e.detail !== 2) return
  if ((e.target as HTMLElement).closest('button')) return
  e.stopPropagation()
  void appWindow.toggleMaximize()
}

export function TitleBar() {
  return (
    <div
      data-tauri-drag-region="deep"
      onMouseUp={onTitleBarMouseUp}
      className="flex h-9 items-center justify-between border-b border-white/8 bg-neutral-900 px-3"
    >
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-sm bg-indigo-500" />
        <span className="text-xs font-semibold text-neutral-200">Poiema Presenter</span>
      </div>
      <div className="flex items-center gap-1 text-neutral-500">
        <button
          onClick={() => appWindow.minimize()}
          className="flex h-6 w-6 items-center justify-center rounded hover:bg-white/10 hover:text-neutral-200"
          aria-label="Minimizar"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => appWindow.toggleMaximize()}
          className="flex h-6 w-6 items-center justify-center rounded hover:bg-white/10 hover:text-neutral-200"
          aria-label="Maximizar"
        >
          <Square className="h-3 w-3" />
        </button>
        <button
          onClick={() => appWindow.close()}
          className="flex h-6 w-6 items-center justify-center rounded hover:bg-red-500/80 hover:text-white"
          aria-label="Fechar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
