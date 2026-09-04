import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { MonitorCheck, SlidersHorizontal } from 'lucide-react'

export function StatusBar() {
  const [error, setError] = useState<string | null>(null)

  const handleOpenProjector = async () => {
    setError(null)
    try {
      await invoke('open_projector', { monitorName: null })
    } catch (err) {
      setError(String(err))
    }
  }

  return (
    <div className="flex items-center justify-between border-b border-white/8 bg-white/5 px-4 py-2">
      <div className="flex items-center gap-2 font-mono text-xs text-neutral-300">
        <MonitorCheck className="h-3.5 w-3.5 text-neutral-500" />
        <span>Two screens detected — main 1920×1080, side 1080×1920</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-indigo-300">Projecting on both</span>
        <button
          onClick={handleOpenProjector}
          className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-neutral-200 hover:bg-white/10"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Screens
        </button>
        {error && (
          <span
            className={`font-mono text-xs ${error.includes('modo ensaio') ? 'text-amber-400' : 'text-red-400'}`}
          >
            {error}
          </span>
        )}
      </div>
    </div>
  )
}
