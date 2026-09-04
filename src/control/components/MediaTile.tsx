import { useState } from 'react'
import { AlertTriangle, FileQuestion } from 'lucide-react'
import { mediaBadge, type MediaAsset } from '../mockMedia'
import { setDragPayload } from '../lib/dnd'

export const STRIPES =
  'bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.06)_0_8px,transparent_8px_16px)]'

interface MediaTileProps {
  asset: MediaAsset
  selected: boolean
  inService: boolean
  onSelect: () => void
}

export function MediaTile({ asset, selected, inService, onSelect }: MediaTileProps) {
  const [hovering, setHovering] = useState(false)
  const missing = asset.status === 'missing'
  const warn = asset.status === 'may-not-play'
  const previewing = hovering && asset.kind === 'video' && !missing

  const frame = missing
    ? 'border-white/8 bg-white/3'
    : warn
      ? `border-orange-500/40 bg-orange-500/10 ${STRIPES}`
      : `border-white/8 bg-white/5 ${STRIPES}`

  return (
    <button
      type="button"
      draggable={!missing}
      onDragStart={(e) => setDragPayload(e, { source: 'media', id: asset.id })}
      onClick={onSelect}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      aria-current={selected || undefined}
      className={`group flex flex-col gap-1.5 text-left ${missing ? '' : 'cursor-grab active:cursor-grabbing'}`}
    >
      <span
        className={`relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-md border transition-[box-shadow,border-color] ${frame} ${
          selected
            ? 'border-indigo-400/60 ring-1 ring-indigo-400/40'
            : 'group-hover:border-white/20'
        } ${previewing ? 'animate-stripes' : ''}`}
      >
        {asset.src && previewing && (
          <video
            src={asset.src}
            muted
            autoPlay
            loop
            playsInline
            className="h-full w-full object-cover"
          />
        )}
        {missing && <FileQuestion className="h-6 w-6 text-neutral-600" />}
        {warn && (
          <span className="absolute top-2 left-2 flex items-center gap-1 font-mono text-[10px] tracking-widest text-orange-400 uppercase">
            <AlertTriangle className="h-3 w-3" />
            May not play
          </span>
        )}
        {!missing && (
          <span
            className={`absolute bottom-2 left-2 font-mono text-[10px] tracking-widest uppercase ${
              warn ? 'text-orange-400' : 'text-neutral-500'
            }`}
          >
            {mediaBadge(asset)}
          </span>
        )}
        {inService && !missing && (
          <span className="absolute right-2 bottom-2 rounded bg-indigo-500/20 px-1.5 py-0.5 font-mono text-[10px] tracking-widest text-indigo-300">
            IN SERVICE
          </span>
        )}
        {previewing && (
          <span className="absolute inset-x-0 bottom-0 h-0.5 bg-white/10">
            <span className="block h-full w-1/3 bg-neutral-300/70" />
          </span>
        )}
      </span>
      <span className={`truncate text-sm ${missing ? 'text-neutral-500' : 'text-neutral-200'}`}>
        {asset.name}
        {missing && <span className="text-orange-400"> · missing</span>}
      </span>
    </button>
  )
}
