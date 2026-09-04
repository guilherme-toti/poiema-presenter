import { AlignLeft, Image, Music, MonitorPlay } from 'lucide-react'
import type { TimelineItem, TimelineItemType } from '../mockData'

const ICONS: Record<TimelineItemType, typeof Image> = {
  countdown: MonitorPlay,
  image: Image,
  song: Music,
  text: AlignLeft,
}

export function TimelineRow({ item }: { item: TimelineItem }) {
  const Icon = ICONS[item.type]

  return (
    <div
      className={`flex items-center gap-2.5 border-l-2 px-3 py-2 ${
        item.selected
          ? 'border-red-500 bg-red-500/10'
          : 'border-transparent hover:bg-white/5'
      }`}
    >
      <span className="w-5 shrink-0 font-mono text-xs text-neutral-500">{item.key}</span>
      <Icon className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
      <span
        className={`flex-1 truncate text-sm ${
          item.selected ? 'font-medium text-neutral-100' : 'text-neutral-300'
        }`}
      >
        {item.title}
      </span>
      {item.badge && (
        <span className="shrink-0 font-mono text-xs text-neutral-500">{item.badge}</span>
      )}
    </div>
  )
}
