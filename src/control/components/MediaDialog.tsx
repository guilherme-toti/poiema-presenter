import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Check,
  Copy,
  FileQuestion,
  Pencil,
  Play,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import type { TimelineEntry } from '../mockData'
import { mediaBadge, searchMedia, type MediaAsset, type MediaKind } from '../mockMedia'
import { timelineHasMedia } from '../lib/timeline'
import { DialogShell, type WindowProps } from './DialogShell'
import { DetailPane } from './DetailPane'
import { MediaTile, STRIPES } from './MediaTile'

const ADDED_FEEDBACK_MS = 1200
const FILTERS: { value: MediaKind | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'video', label: 'Video' },
  { value: 'image', label: 'Image' },
]

interface MediaDialogProps extends WindowProps {
  media: MediaAsset[]
  timeline: TimelineEntry[]
  onAdd: (asset: MediaAsset) => void
  onClose: () => void
}

function formatLastUsed(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function MediaDialog({ media, timeline, onAdd, onClose, ...windowProps }: MediaDialogProps) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<MediaKind | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [justAddedId, setJustAddedId] = useState<string | null>(null)

  const visible = useMemo(() => searchMedia(media, query, filter), [media, query, filter])
  const selected = media.find((m) => m.id === selectedId) ?? null
  const selectedInService = selected ? timelineHasMedia(timeline, selected.id) : false
  const missing = selected?.status === 'missing'
  const warn = selected?.status === 'may-not-play'

  useEffect(() => {
    if (!justAddedId) return
    const timer = setTimeout(() => setJustAddedId(null), ADDED_FEEDBACK_MS)
    return () => clearTimeout(timer)
  }, [justAddedId])

  const add = (asset: MediaAsset) => {
    onAdd(asset)
    setJustAddedId(asset.id)
  }

  return (
    <DialogShell
      title="Media"
      titleId="media-dialog-title"
      initialHeight={600}
      minWidth={720}
      minHeight={420}
      onClose={onClose}
      {...windowProps}
    >
      <div className="flex flex-1 overflow-hidden">
        <div className="flex w-[640px] min-w-[320px] flex-1 flex-col overflow-hidden p-3">
          <label className="mb-3 flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm text-neutral-300 focus-within:border-indigo-400/60">
            <Search className="h-4 w-4 shrink-0 text-neutral-500" />
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search media"
              className="flex-1 bg-transparent text-neutral-100 placeholder:text-neutral-600 focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
            />
          </label>

          <div role="radiogroup" className="mb-3 flex items-center gap-1 px-1">
            {FILTERS.map(({ value, label }) => {
              const active = filter === value
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setFilter(value)}
                  className={`rounded-full px-2.5 py-1 font-mono text-[10px] tracking-widest uppercase ${
                    active
                      ? 'bg-white/10 text-neutral-100'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>

          <div className="grid flex-1 auto-rows-min grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-3 overflow-y-auto px-1 pb-1">
            {visible.map((asset) => (
              <MediaTile
                key={asset.id}
                asset={asset}
                selected={asset.id === selectedId}
                inService={timelineHasMedia(timeline, asset.id)}
                onSelect={() => setSelectedId(asset.id)}
              />
            ))}
            <button
              type="button"
              className="flex aspect-video items-center justify-center gap-1.5 self-start rounded-md border border-dashed border-white/15 text-sm text-neutral-500 hover:border-white/30 hover:text-neutral-300"
            >
              <Plus className="h-4 w-4" />
              Import
            </button>
          </div>
        </div>

        <DetailPane open={selected !== null}>
          {selected && (
            <div className="flex flex-1 flex-col overflow-hidden p-6">
              <div
                className={`relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-md border ${
                  missing
                    ? 'border-white/8 bg-white/3'
                    : warn
                      ? `border-orange-500/40 bg-orange-500/10 ${STRIPES}`
                      : `border-white/8 bg-white/5 ${STRIPES}`
                }`}
              >
                {selected.src && selected.kind === 'video' ? (
                  <video src={selected.src} controls className="h-full w-full object-cover" />
                ) : missing ? (
                  <FileQuestion className="h-8 w-8 text-neutral-600" />
                ) : selected.kind === 'video' ? (
                  <button
                    type="button"
                    aria-label="Play with sound"
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900/80 text-neutral-100 ring-1 ring-white/20 hover:bg-neutral-800"
                  >
                    <Play className="ml-0.5 h-5 w-5" />
                  </button>
                ) : null}
                {!missing && (
                  <span
                    className={`absolute bottom-2 left-2 font-mono text-[10px] tracking-widest uppercase ${
                      warn ? 'text-orange-400' : 'text-neutral-500'
                    }`}
                  >
                    {mediaBadge(selected)}
                  </span>
                )}
              </div>

              <h3 className="mt-4 truncate text-lg font-semibold text-neutral-100">
                {selected.name}
              </h3>
              <p className="mt-1 font-mono text-xs text-neutral-500">
                {selected.resolution} · {selected.size} · used in {selected.usedIn} services · last{' '}
                {formatLastUsed(selected.lastUsed)}
              </p>

              {warn && (
                <p className="mt-4 flex items-start gap-2 rounded-md border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-xs text-orange-200">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  HEVC may not play on this machine. Convert to H.264 before the service.
                </p>
              )}
              {missing && (
                <p className="mt-4 flex items-start gap-2 rounded-md border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-xs text-orange-200">
                  <FileQuestion className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  File not found. It may have been moved or deleted.
                  <button type="button" className="ml-auto shrink-0 font-medium underline">
                    Relink
                  </button>
                </p>
              )}

              <div className="mt-auto flex flex-col gap-3 pt-5">
                <button
                  type="button"
                  disabled={missing}
                  onClick={() => add(selected)}
                  className={`flex items-center justify-center gap-2 rounded-md border py-3.5 text-base font-medium transition-colors ${
                    justAddedId === selected.id
                      ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-200'
                      : missing
                        ? 'border-white/8 text-neutral-600'
                        : 'border-indigo-400/60 text-neutral-100 hover:bg-indigo-500/10'
                  }`}
                >
                  {justAddedId === selected.id ? (
                    <>
                      <Check className="h-4 w-4" />
                      Added
                    </>
                  ) : (
                    <>
                      <Plus className={`h-4 w-4 ${missing ? '' : 'text-indigo-300'}`} />
                      Add to service
                    </>
                  )}
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
                    Edit
                  </button>
                </div>
                <button
                  type="button"
                  disabled={selectedInService}
                  className={`flex items-center justify-center gap-2 rounded-md border py-3 text-sm ${
                    selectedInService
                      ? 'border-white/8 text-neutral-600'
                      : 'border-white/10 text-neutral-200 hover:bg-white/5'
                  }`}
                >
                  <Trash2 className="h-4 w-4" />
                  {selectedInService ? 'Delete — in current service' : 'Delete'}
                </button>
              </div>
            </div>
          )}
        </DetailPane>
      </div>
    </DialogShell>
  )
}
