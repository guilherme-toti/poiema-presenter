import type { LucideIcon } from 'lucide-react'
import {
  AlignLeft,
  Calendar,
  ListOrdered,
  Music,
  Image,
  MonitorPlay,
  Type,
  Monitor,
} from 'lucide-react'

export type Library =
  'service' | 'songs' | 'media' | 'backgrounds' | 'texts' | 'schedule' | 'themes' | 'screens'

interface NavItem {
  library: Library
  icon: LucideIcon
  label: string
}

interface NavIconProps extends NavItem {
  active: boolean
  onOpen: (library: Library) => void
}

function NavIcon({ library, icon: Icon, label, active, onOpen }: NavIconProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={() => onOpen(library)}
      className="group relative flex h-9 w-9 items-center justify-center"
    >
      {/* Pill: sits behind the icon at 36px, grows to the right on hover revealing the label */}
      <span
        aria-hidden
        className={`pointer-events-none absolute top-0 left-0 z-20 flex h-9 max-w-9 items-center overflow-hidden rounded-md backdrop-blur-md transition-[max-width,opacity,box-shadow] duration-200 ease-out group-hover:max-w-48 group-hover:shadow-lg group-hover:shadow-black/40 ${
          active
            ? 'bg-indigo-500/20 text-indigo-300'
            : 'bg-white/10 text-neutral-200 opacity-0 group-hover:opacity-100'
        }`}
      >
        <span className="h-9 w-9 shrink-0" />
        <span className="pr-3 text-xs font-medium whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-hover:delay-75">
          {label}
        </span>
      </span>
      <Icon
        className={`relative z-30 h-4 w-4 transition-colors ${
          active ? 'text-indigo-300' : 'text-neutral-500 group-hover:text-neutral-200'
        }`}
      />
    </button>
  )
}

const topItems: NavItem[] = [
  { library: 'service', icon: ListOrdered, label: 'Service' },
  { library: 'songs', icon: Music, label: 'Songs' },
  { library: 'media', icon: Image, label: 'Media' },
  { library: 'backgrounds', icon: MonitorPlay, label: 'Backgrounds' },
  { library: 'texts', icon: AlignLeft, label: 'Texts' },
  { library: 'schedule', icon: Calendar, label: 'Schedule' },
]
const bottomItems: NavItem[] = [
  { library: 'themes', icon: Type, label: 'Themes' },
  { library: 'screens', icon: Monitor, label: 'Screens' },
]

interface NavRailProps {
  /** Libraries whose windows are currently open. */
  active: readonly Library[]
  onOpen: (library: Library) => void
}

export function NavRail({ active, onOpen }: NavRailProps) {
  return (
    <div className="flex flex-col items-center justify-between border-r border-white/8 bg-neutral-900 py-3">
      <div className="flex flex-col gap-1">
        {topItems.map((item) => (
          <NavIcon
            key={item.library}
            {...item}
            active={active.includes(item.library)}
            onOpen={onOpen}
          />
        ))}
      </div>
      <div className="flex flex-col gap-1">
        {bottomItems.map((item) => (
          <NavIcon
            key={item.library}
            {...item}
            active={active.includes(item.library)}
            onOpen={onOpen}
          />
        ))}
      </div>
    </div>
  )
}
