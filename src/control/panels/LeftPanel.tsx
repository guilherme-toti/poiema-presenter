export function LeftPanel() {
  return (
    <div className="flex flex-col border-r border-white/8 bg-white/5">
      <div className="border-b border-white/8 p-4">
        <h1 className="text-sm font-semibold tracking-wide text-neutral-100">
          Poiema Presenter
        </h1>
        <p className="mt-1 text-xs text-neutral-400">Roteiro</p>
      </div>
      <div className="flex flex-1 items-center justify-center p-4 text-center text-sm text-neutral-500">
        Nenhum evento aberto ainda.
      </div>
    </div>
  )
}
