import type { SlideRowData } from '../mockData'

export const SLIDE_ROW_GRID = 'grid grid-cols-[3rem_6rem_1fr_9rem] items-center gap-4'

export function SlideRow({ slide }: { slide: SlideRowData }) {
  return (
    <div
      className={`${SLIDE_ROW_GRID} border-l-2 px-4 py-3 ${
        slide.state === 'live'
          ? 'border-red-500 bg-red-500/10'
          : 'border-transparent hover:bg-white/5'
      } ${slide.dimmed ? 'opacity-40' : ''}`}
    >
      <span className="font-mono text-sm text-neutral-400">{slide.key}</span>
      <span className="text-sm text-neutral-400">{slide.part}</span>
      <span
        className={`truncate text-sm ${slide.state === 'live' ? 'text-neutral-100' : 'text-neutral-200'}`}
      >
        {slide.text}
      </span>
      <span className="text-right font-mono text-xs">
        {slide.state === 'live' && <span className="font-semibold text-red-400">ON AIR</span>}
        {slide.state === 'next' && <span className="text-indigo-300">CLICK → AIR</span>}
        {slide.trailingLabel && <span className="text-neutral-600">{slide.trailingLabel}</span>}
      </span>
    </div>
  )
}
