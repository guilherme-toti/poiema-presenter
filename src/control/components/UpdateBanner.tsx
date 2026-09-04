import type { UpdaterState } from '../hooks/updaterReducer'

interface UpdateBannerProps {
  updater: Pick<UpdaterState, 'status' | 'version'> & { restart: () => Promise<void> }
}

export function UpdateBanner({ updater }: UpdateBannerProps) {
  if (updater.status === 'downloading') {
    return (
      <div className="flex items-center justify-center gap-2 bg-blue-500/20 px-4 py-1.5 text-xs text-blue-200">
        <span>Nova versão {updater.version} disponível — baixando em segundo plano…</span>
      </div>
    )
  }

  if (updater.status === 'ready') {
    return (
      <div className="flex items-center justify-center gap-3 bg-emerald-500/20 px-4 py-1.5 text-xs text-emerald-200">
        <span>Atualização pronta — reinicie para aplicar.</span>
        <button
          onClick={() => updater.restart()}
          className="rounded bg-emerald-500/30 px-2 py-0.5 font-medium hover:bg-emerald-500/40"
        >
          Reiniciar agora
        </button>
      </div>
    )
  }

  return null
}
