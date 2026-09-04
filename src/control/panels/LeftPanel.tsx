import { ChevronDown, Plus } from 'lucide-react'
import { TimelineRow } from '../components/TimelineRow'
import { timelineItems } from '../mockData'

export function LeftPanel() {
  return (
    <div className="flex flex-col border-r border-white/8 bg-white/5">
      <div className="flex items-center justify-between border-b border-white/8 p-4">
        <button className="flex items-center gap-1.5 text-sm font-semibold text-neutral-100">
          Sunday Service · Sep 7
          <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
        </button>
        <Plus className="h-4 w-4 text-neutral-500" />
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {timelineItems.map((item) => (
          <div key={item.key}>
            {item.sectionAbove && (
              <div className="mt-3 mb-1 px-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] tracking-widest text-neutral-500">
                    {item.sectionAbove}
                  </span>
                  <span className="h-px flex-1 bg-white/8" />
                </div>
              </div>
            )}
            <TimelineRow item={item} />
          </div>
        ))}
      </div>

      <div className="border-t border-white/8 px-3 py-2">
        <span className="font-mono text-[11px] text-neutral-500">
          autosaved · {timelineItems.length} items
        </span>
      </div>
    </div>
  )
}
