import { useEffect, useMemo, useState } from 'react'
import { Check, Copy, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import type { TimelineEntry } from '../mockData'
import { recentSongs, searchSongs, songSlideCount, type Song } from '../mockSongs'
import { timelineHasSong } from '../lib/timeline'
import { DialogShell } from './DialogShell'
import { SongRow } from './SongRow'

const ADDED_FEEDBACK_MS = 1200

interface SongsDialogProps {
  songs: Song[]
  timeline: TimelineEntry[]
  onAdd: (song: Song) => void
  onClose: () => void
}

function formatLastUsed(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function SongsDialog({ songs, timeline, onAdd, onClose }: SongsDialogProps) {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [justAddedId, setJustAddedId] = useState<string | null>(null)

  const searching = query.trim().length > 0
  const visible = useMemo(
    () => (searching ? searchSongs(songs, query) : recentSongs(songs)),
    [songs, query, searching],
  )
  const selected = songs.find((s) => s.id === selectedId) ?? null
  const selectedInService = selected ? timelineHasSong(timeline, selected.id) : false

  useEffect(() => {
    if (!justAddedId) return
    const timer = setTimeout(() => setJustAddedId(null), ADDED_FEEDBACK_MS)
    return () => clearTimeout(timer)
  }, [justAddedId])

  const add = (song: Song) => {
    onAdd(song)
    setJustAddedId(song.id)
  }

  return (
    <DialogShell
      title="Songs"
      titleId="songs-dialog-title"
      className={`h-[600px] transition-[max-width] duration-300 ease-out ${
        selected ? 'max-w-[1040px]' : 'max-w-[640px]'
      }`}
      onClose={onClose}
    >
      <div
        className={`grid flex-1 overflow-hidden ${
          selected ? 'grid-cols-[1fr_400px]' : 'grid-cols-1'
        }`}
      >
        <div className="flex flex-col overflow-hidden border-r border-white/8 p-3">
          <div className="mb-3 flex items-center gap-2">
            <label className="flex flex-1 items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm text-neutral-300 focus-within:border-indigo-400/60">
              <Search className="h-4 w-4 shrink-0 text-neutral-500" />
              <input
                autoFocus
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search songs…"
                className="flex-1 bg-transparent text-neutral-100 placeholder:text-neutral-600 focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
              />
            </label>
            <button
              type="button"
              className="flex items-center gap-2 rounded-md border border-indigo-400/60 px-3 py-2 text-sm font-medium text-neutral-100 hover:bg-indigo-500/10"
            >
              <Plus className="h-4 w-4" />
              New song
            </button>
          </div>

          <div className="mb-1 px-4 font-mono text-[10px] tracking-widest text-neutral-500 uppercase">
            {searching ? `Results · ${visible.length}` : 'Recent'}
          </div>

          <div className="flex-1 space-y-0.5 overflow-y-auto">
            {visible.map((song) => (
              <SongRow
                key={song.id}
                song={song}
                selected={song.id === selectedId}
                inService={timelineHasSong(timeline, song.id)}
                onSelect={() => setSelectedId(song.id)}
              />
            ))}
            {visible.length === 0 && (
              <div className="px-4 py-10 text-center text-sm text-neutral-500">
                No songs match “{query.trim()}”.
                <button type="button" className="ml-1 text-indigo-300 hover:underline">
                  Create it
                </button>
              </div>
            )}
          </div>
        </div>

        {selected && (
          <div className="flex flex-col overflow-hidden p-6">
            <h3 className="text-xl font-semibold text-neutral-100">{selected.title}</h3>
            <p className="mt-1 font-mono text-xs text-neutral-500">
              {selected.artist} · {songSlideCount(selected)} slides · last used{' '}
              {formatLastUsed(selected.lastUsed)}
            </p>

            <div className="mt-5 flex-1 space-y-5 overflow-y-auto pr-2">
              {selected.sections.map((section) => (
                <div key={section.label}>
                  <div className="mb-1.5 font-mono text-[10px] tracking-widest text-neutral-500 uppercase">
                    {section.label}
                  </div>
                  <p className="text-sm leading-relaxed text-neutral-300">
                    {section.lines.map((line, i) => (
                      <span key={i} className="block">
                        {line}
                      </span>
                    ))}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => add(selected)}
                className={`flex items-center justify-center gap-2 rounded-md border py-3.5 text-base font-medium transition-colors ${
                  justAddedId === selected.id
                    ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-200'
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
                    <Plus className="h-4 w-4 text-indigo-300" />
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
      </div>
    </DialogShell>
  )
}
