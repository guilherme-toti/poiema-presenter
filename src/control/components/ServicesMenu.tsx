import { useEffect, useRef } from 'react'
import type { Service } from '../mockData'
import { ServiceRow } from './ServiceRow'

interface ServicesMenuProps {
  services: Service[]
  currentId: string
  onSelect: (service: Service) => void
  onClose: () => void
}

export function ServicesMenu({ services, currentId, onSelect, onClose }: ServicesMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      role="menu"
      className="absolute top-full left-2 z-30 mt-1 w-[360px] rounded-lg border border-white/10 bg-neutral-900 p-1 shadow-xl shadow-black/50"
    >
      {services.map((service) => (
        <ServiceRow
          key={service.id}
          service={service}
          selected={service.id === currentId}
          onSelect={() => onSelect(service)}
        />
      ))}
    </div>
  )
}
