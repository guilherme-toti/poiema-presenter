import { useCallback, useState } from 'react'
import { ChevronDown, Plus } from 'lucide-react'
import { TimelineRow } from '../components/TimelineRow'
import { TimelineHeader } from '../components/TimelineHeader'
import { ServicesMenu } from '../components/ServicesMenu'
import { recentServices, timelineItemsOf, type Service, type TimelineEntry } from '../mockData'

interface LeftPanelProps {
  currentService: Service
  onSelectService: (service: Service) => void
  onOpenServices: () => void
  timeline: TimelineEntry[]
  selectedItemId: string | null
  onSelectItem: (id: string) => void
}

/**
 * Per-entry display data: headers get the number of items until the next
 * header, items get their running number (headers don't count).
 */
function timelineLabels(entries: TimelineEntry[]): Map<string, string> {
  const labels = new Map<string, string>()
  const counts = new Map<string, number>()
  let currentHeader: string | null = null
  let itemNumber = 0
  for (const entry of entries) {
    if (entry.kind === 'header') {
      currentHeader = entry.id
      counts.set(entry.id, 0)
    } else {
      itemNumber += 1
      labels.set(entry.id, String(itemNumber).padStart(2, '0'))
      if (currentHeader) counts.set(currentHeader, (counts.get(currentHeader) ?? 0) + 1)
    }
  }
  for (const [id, count] of counts) labels.set(id, String(count))
  return labels
}

export function LeftPanel({
  currentService,
  onSelectService,
  onOpenServices,
  timeline,
  selectedItemId,
  onSelectItem,
}: LeftPanelProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  const labels = timelineLabels(timeline)
  const itemCount = timelineItemsOf(timeline).length

  return (
    <div className="flex flex-col border-r border-white/8 bg-white/5">
      <div className="relative flex items-center justify-between border-b border-white/8 p-4">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setMenuOpen((open) => !open)}
          className={`group -mx-2 -my-1 flex items-center gap-1.5 rounded px-2 py-1 text-sm font-semibold text-neutral-100 hover:bg-white/10 ${
            menuOpen ? 'bg-white/10' : ''
          }`}
        >
          {currentService.title} · {currentService.date}
          <ChevronDown
            className={`h-3.5 w-3.5 text-neutral-500 transition-transform group-hover:text-neutral-200 ${
              menuOpen ? 'rotate-180 text-neutral-200' : ''
            }`}
          />
        </button>
        <button
          type="button"
          aria-label="Services"
          onClick={onOpenServices}
          className="flex h-6 w-6 items-center justify-center rounded text-neutral-500 hover:bg-white/10 hover:text-neutral-200"
        >
          <Plus className="h-4 w-4" />
        </button>

        {menuOpen && (
          <ServicesMenu
            services={recentServices}
            currentId={currentService.id}
            onSelect={(service) => {
              onSelectService(service)
              setMenuOpen(false)
            }}
            onClose={closeMenu}
          />
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {timeline.map((entry, index) => {
          if (entry.kind === 'header') {
            return (
              <TimelineHeader
                key={entry.id}
                header={entry}
                count={Number(labels.get(entry.id) ?? 0)}
                first={index === 0}
              />
            )
          }
          return (
            <TimelineRow
              key={entry.id}
              item={entry}
              number={labels.get(entry.id) ?? ''}
              selected={entry.id === selectedItemId}
              onSelect={() => onSelectItem(entry.id)}
            />
          )
        })}
      </div>

      <div className="border-t border-white/8 px-3 py-2">
        <span className="font-mono text-[11px] text-neutral-500">
          autosaved · {itemCount} items
        </span>
      </div>
    </div>
  )
}
