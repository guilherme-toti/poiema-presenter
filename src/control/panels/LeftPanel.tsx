import { useCallback, useState } from 'react'
import { ChevronDown, Plus } from 'lucide-react'
import { TimelineRow } from '../components/TimelineRow'
import { ServicesMenu } from '../components/ServicesMenu'
import { ServicesDialog } from '../components/ServicesDialog'
import { recentServices, timelineItems, type Service } from '../mockData'

export function LeftPanel() {
  const [current, setCurrent] = useState<Service>(recentServices[0])
  const [menuOpen, setMenuOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const closeDialog = useCallback(() => setDialogOpen(false), [])

  return (
    <div className="flex flex-col border-r border-white/8 bg-white/5">
      <div className="relative flex items-center justify-between border-b border-white/8 p-4">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setMenuOpen((open) => !open)}
          className="flex items-center gap-1.5 text-sm font-semibold text-neutral-100"
        >
          {current.title} · {current.date}
          <ChevronDown
            className={`h-3.5 w-3.5 text-neutral-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
          />
        </button>
        <button
          type="button"
          aria-label="Services"
          onClick={() => setDialogOpen(true)}
          className="flex h-6 w-6 items-center justify-center rounded text-neutral-500 hover:bg-white/10 hover:text-neutral-200"
        >
          <Plus className="h-4 w-4" />
        </button>

        {menuOpen && (
          <ServicesMenu
            services={recentServices}
            currentId={current.id}
            onSelect={(service) => {
              setCurrent(service)
              setMenuOpen(false)
            }}
            onClose={closeMenu}
          />
        )}
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

      {dialogOpen && (
        <ServicesDialog
          services={recentServices}
          currentId={current.id}
          onOpen={(service) => {
            setCurrent(service)
            setDialogOpen(false)
          }}
          onClose={closeDialog}
        />
      )}
    </div>
  )
}
