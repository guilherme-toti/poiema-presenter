export function RightPanel() {
  return (
    <div className="flex flex-col border-l border-white/8 bg-white/5">
      <div className="border-b border-white/8 p-4">
        <p className="text-xs uppercase tracking-wide text-neutral-400">Ao Vivo</p>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-1 p-4 text-center text-sm text-neutral-500">
        <span>Projetor não iniciado.</span>
      </div>
    </div>
  )
}
