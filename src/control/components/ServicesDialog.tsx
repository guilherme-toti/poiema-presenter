import { useEffect, useState } from 'react'
import { ArrowRight, Copy, Minus, Pencil, Plus, Search, Square, Trash2, X } from 'lucide-react'
import type { Service } from '../mockData'
import { ServiceRow } from './ServiceRow'

const PREVIEW_ITEMS = 5

interface ServicesDialogProps {
  services: Service[]
  currentId: string
  onOpen: (service: Service) => void
  onClose: () => void
}

export function ServicesDialog({ services, currentId, onOpen, onClose }: ServicesDialogProps) {
  const [selectedId, setSelectedId] = useState(currentId)
  const selected = services.find((s) => s.id === selectedId) ?? services[0]
  const hiddenCount = selected.items.length - PREVIEW_ITEMS

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-8"
      onPointerDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="services-dialog-title"
        onPointerDown={(e) => e.stopPropagation()}
        className="flex h-[680px] w-full max-w-[1200px] flex-col overflow-hidden rounded-lg border border-white/10 bg-neutral-900 shadow-2xl shadow-black/60"
      >
        <div className="flex h-9 shrink-0 items-center justify-between border-b border-white/8 px-3">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-indigo-500" />
            <span id="services-dialog-title" className="text-xs font-semibold text-neutral-200">
              Services
            </span>
          </div>
          <div className="flex items-center gap-1 text-neutral-500">
            <span className="flex h-6 w-6 items-center justify-center">
              <Minus className="h-3.5 w-3.5" />
            </span>
            <span className="flex h-6 w-6 items-center justify-center">
              <Square className="h-3 w-3" />
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="flex h-6 w-6 items-center justify-center rounded hover:bg-red-500/80 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-[1fr_minmax(360px,440px)] overflow-hidden">
          <div className="flex flex-col overflow-hidden border-r border-white/8 p-3">
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                className="flex items-center gap-2 rounded-md border border-indigo-400/60 px-3 py-2 text-sm font-medium text-neutral-100 hover:bg-indigo-500/10"
              >
                <Plus className="h-4 w-4" />
                New service
              </button>
              <button
                type="button"
                className="flex items-center gap-2 rounded-md border border-white/10 px-4 py-2 text-sm text-neutral-300 hover:bg-white/5"
              >
                <Search className="h-4 w-4" />
                Search
              </button>
            </div>
            <div className="flex-1 space-y-1 overflow-y-auto">
              {services.map((service) => (
                <ServiceRow
                  key={service.id}
                  service={service}
                  selected={service.id === selected.id}
                  onSelect={() => setSelectedId(service.id)}
                  onOpen={() => onOpen(service)}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col p-6">
            <h3 className="text-xl font-semibold text-neutral-100">{selected.title}</h3>
            <p className="mt-1 font-mono text-xs text-neutral-500">{selected.createdLabel}</p>

            <ol className="mt-6 space-y-2">
              {selected.items.slice(0, PREVIEW_ITEMS).map((title, i) => (
                <li key={title + i} className="flex items-center gap-3 text-sm text-neutral-300">
                  <span className="w-5 font-mono text-xs text-neutral-500">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {title}
                </li>
              ))}
              {hiddenCount > 0 && (
                <li className="pl-8 text-sm text-neutral-500">+ {hiddenCount} more</li>
              )}
            </ol>

            <div className="mt-auto flex flex-col gap-3">
              <button
                type="button"
                onClick={() => onOpen(selected)}
                className="flex items-center justify-center gap-2 rounded-md border border-indigo-400/60 py-3.5 text-base font-medium text-neutral-100 hover:bg-indigo-500/10"
              >
                <ArrowRight className="h-4 w-4 text-indigo-300" />
                Open
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-md border border-white/10 py-3 text-sm text-neutral-200 hover:bg-white/5"
                >
                  <Copy className="h-4 w-4" />
                  Duplicate
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-md border border-white/10 py-3 text-sm text-neutral-200 hover:bg-white/5"
                >
                  <Pencil className="h-4 w-4" />
                  Rename
                </button>
              </div>
              <button
                type="button"
                disabled
                className="flex items-center justify-center gap-2 rounded-md border border-white/8 py-3 text-sm text-neutral-600"
              >
                <Trash2 className="h-4 w-4" />
                Delete — blocked while projecting
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
