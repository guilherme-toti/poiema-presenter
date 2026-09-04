import type { LucideIcon } from 'lucide-react'
import { AlignLeft, Calendar, ListOrdered, Music, Image, MonitorPlay, Type, Monitor } from 'lucide-react'

interface NavIconProps {
  icon: LucideIcon
  active?: boolean
}

function NavIcon({ icon: Icon, active }: NavIconProps) {
  return (
    <div
      className={`flex h-9 w-9 items-center justify-center rounded-md ${
        active ? 'bg-indigo-500/20 text-indigo-300' : 'text-neutral-500'
      }`}
    >
      <Icon className="h-4 w-4" />
    </div>
  )
}

const topIcons: LucideIcon[] = [ListOrdered, Music, Image, MonitorPlay, AlignLeft, Calendar]
const bottomIcons: LucideIcon[] = [Type, Monitor]

export function NavRail() {
  return (
    <div className="flex flex-col items-center justify-between border-r border-white/8 bg-neutral-900 py-3">
      <div className="flex flex-col gap-1">
        {topIcons.map((Icon, index) => (
          <NavIcon key={index} icon={Icon} active={index === 0} />
        ))}
      </div>
      <div className="flex flex-col gap-1">
        {bottomIcons.map((Icon, index) => (
          <NavIcon key={index} icon={Icon} />
        ))}
      </div>
    </div>
  )
}
