import type { Service } from '../mockData'

interface ServiceRowProps {
  service: Service
  selected: boolean
  onSelect: () => void
  onOpen?: () => void
}

export function ServiceRow({ service, selected, onSelect, onOpen }: ServiceRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      onDoubleClick={onOpen}
      aria-current={selected || undefined}
      className={`flex w-full items-center gap-4 rounded-lg border px-4 py-3 text-left ${
        selected ? 'border-indigo-400/60 bg-white/5' : 'border-transparent hover:bg-white/5'
      }`}
    >
      <span
        className={`w-12 shrink-0 font-mono text-[11px] uppercase tracking-widest ${
          selected ? 'text-indigo-300' : 'text-neutral-500'
        }`}
      >
        {service.date}
      </span>
      <span
        className={`flex-1 truncate text-sm ${
          selected ? 'font-semibold text-neutral-100' : 'text-neutral-300'
        }`}
      >
        {service.title}
      </span>
      {service.today && (
        <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] tracking-widest text-neutral-200">
          TODAY
        </span>
      )}
      <span className="shrink-0 font-mono text-xs text-neutral-500">
        {service.items.length} items
      </span>
    </button>
  )
}
