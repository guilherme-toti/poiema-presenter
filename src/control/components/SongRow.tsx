import { songSlideCount, type Song } from '../mockSongs'

interface SongRowProps {
  song: Song
  selected: boolean
  inService: boolean
  onSelect: () => void
}

export function SongRow({ song, selected, inService, onSelect }: SongRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected || undefined}
      className={`flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left ${
        selected ? 'border-indigo-400/60 bg-white/5' : 'border-transparent hover:bg-white/5'
      }`}
    >
      <span className="min-w-0 flex-1">
        <span
          className={`block truncate text-sm ${
            selected ? 'font-semibold text-neutral-100' : 'text-neutral-200'
          }`}
        >
          {song.title}
        </span>
        <span className="block truncate text-xs text-neutral-500">{song.artist}</span>
      </span>
      {inService && (
        <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 font-mono text-[10px] tracking-widest text-indigo-300">
          IN SERVICE
        </span>
      )}
      <span className="w-20 shrink-0 text-right font-mono text-xs whitespace-nowrap text-neutral-500">
        {songSlideCount(song)} slides
      </span>
    </button>
  )
}
