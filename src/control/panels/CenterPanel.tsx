import { Image, LayoutList, LayoutGrid, Pencil } from 'lucide-react'
import { SLIDE_ROW_GRID, SlideRow } from '../components/SlideRow'
import { currentSongSlides } from '../mockData'

const hints = [
  ['↓ Space', 'next', 'projects'],
  ['↑', 'previous', 'projects'],
  ['1–9', 'that row', 'projects'],
  ['← →', 'other item', ''],
  ['B', 'black', ''],
  ['C', 'clear', ''],
]

export function CenterPanel() {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-white/8 p-4">
        <div>
          <h2 className="text-sm font-semibold text-neutral-100">Oceans</h2>
          <p className="text-xs text-neutral-500">Hillsong · 14 slides</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-neutral-400">
          <span className="flex items-center gap-1.5">
            <Image className="h-3.5 w-3.5" />
            Background inherited
          </span>
          <span className="flex items-center gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            Edit lyrics
          </span>
          <div className="flex items-center rounded-md bg-white/10 p-0.5">
            <span className="flex items-center gap-1 rounded bg-white/10 px-2 py-1 text-neutral-100">
              <LayoutList className="h-3.5 w-3.5" />
              List
            </span>
            <span className="flex items-center gap-1 px-2 py-1 text-neutral-500">
              <LayoutGrid className="h-3.5 w-3.5" />
              Cards
            </span>
          </div>
        </div>
      </div>

      <div
        className={`${SLIDE_ROW_GRID} border-b border-white/8 px-4 py-2 font-mono text-[10px] tracking-widest text-neutral-500`}
      >
        <span>KEY</span>
        <span>PART</span>
        <span>ON THE SCREEN</span>
        <span className="text-right">STATE</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {currentSongSlides.map((slide) => (
          <SlideRow key={slide.key + slide.text} slide={slide} />
        ))}
      </div>

      <div className="flex items-center justify-end gap-4 border-t border-white/8 px-4 py-2 font-mono text-[11px] text-neutral-500">
        {hints.map(([key, action, suffix]) => (
          <span key={key}>
            <span className="text-neutral-300">{key}</span> {action}
            {suffix && <span className="text-neutral-600"> — {suffix}</span>}
          </span>
        ))}
      </div>
    </div>
  )
}
