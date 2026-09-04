import { invoke } from '@tauri-apps/api/core'
import { useState } from 'react'

export function RightPanel() {
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
    <div className="flex flex-col border-l border-white/8 bg-white/5">
      <div className="border-b border-white/8 p-4">
        <p className="text-xs uppercase tracking-wide text-neutral-400">Ao Vivo</p>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center text-sm text-neutral-500">
        <span>Projetor não iniciado.</span>
        <button
          onClick={handleOpenProjector}
          className="rounded-md bg-white/10 px-3 py-1.5 text-xs font-medium text-neutral-100 hover:bg-white/20"
        >
          Abrir Projetor
        </button>
        {error && (
          <span
            className={`text-xs ${error.includes('modo ensaio') ? 'text-amber-400' : 'text-red-400'}`}
          >
            {error}
          </span>
        )}
      </div>
    </div>
  )
}
