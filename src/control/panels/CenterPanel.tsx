export function CenterPanel() {
  return (
    <div className="flex flex-col">
      <div className="border-b border-white/8 p-4">
        <p className="text-xs uppercase tracking-wide text-neutral-400">Slides</p>
      </div>
      <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
        Selecione um item do roteiro para ver os slides.
      </div>
    </div>
  )
}
