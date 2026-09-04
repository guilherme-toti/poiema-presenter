import { Pencil, Plus } from 'lucide-react'
import type { TimelineHeader as TimelineHeaderData } from '../mockData'

interface TimelineHeaderProps {
  header: TimelineHeaderData
  /** Number of items in this section (until the next header). */
  count: number
  first?: boolean
}

export function TimelineHeader({ header, count, first }: TimelineHeaderProps) {
  return (
    <div className={`${first ? 'mt-1' : 'mt-3'} mb-1 px-3`}>
      <div className="group flex h-5 items-center gap-2">
        <span className="font-mono text-[10px] tracking-widest text-neutral-500 uppercase">
          {header.title}
        </span>
        <span className="h-px flex-1 bg-white/8" />
        <span className="font-mono text-[10px] text-neutral-600">{count}</span>
        <span className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            aria-label={`Rename ${header.title}`}
            className="flex h-5 w-5 items-center justify-center rounded text-neutral-500 hover:bg-white/10 hover:text-neutral-200"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            type="button"
            aria-label={`Add to ${header.title}`}
            className="flex h-5 w-5 items-center justify-center rounded text-neutral-500 hover:bg-white/10 hover:text-neutral-200"
          >
            <Plus className="h-3 w-3" />
          </button>
        </span>
      </div>
      {count === 0 && <p className="pt-1 text-xs text-neutral-600 italic">Nothing here yet</p>}
    </div>
  )
}
