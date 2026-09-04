import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { AlertTriangle } from 'lucide-react'
import type { Anchor, Background, Slot, SlotField, Theme } from '../mockThemes'
import { STRIPES } from './MediaTile'

/** px at 1920-wide reference → container-query width units. */
const cq = (px: number) => `${(px / 19.2).toFixed(3)}cqw`

const ANCHOR_CLASS: Record<Anchor, string> = {
  top: 'justify-start',
  center: 'justify-center',
  bottom: 'justify-end',
}

const BACKGROUND_CLASS: Record<Background, string> = {
  inherited: `bg-neutral-800 ${STRIPES}`,
  black: 'bg-black',
  dim: 'bg-gradient-to-b from-neutral-800 to-neutral-950',
}

interface ThemePreviewProps {
  theme: Theme
  slide: Partial<Record<SlotField, string>>
  selectedSlotId?: string | null
  onSelectSlot?: (id: string) => void
  /** Rounded corners and border for the editor; off for thumbnails. */
  framed?: boolean
}

function slotStyle(slot: Slot): CSSProperties {
  const s = slot.style
  return {
    fontFamily: `'${s.fontFamily}', sans-serif`,
    fontSize: cq(s.size),
    fontWeight: s.weight,
    fontStyle: s.italic ? 'italic' : 'normal',
    textTransform: s.uppercase ? 'uppercase' : 'none',
    color: s.color,
    textAlign: s.align,
    lineHeight: s.lineHeight,
    opacity: s.opacity / 100,
    textShadow: s.shadow ? `0 ${cq(4)} ${cq(16)} rgba(0,0,0,0.7)` : 'none',
    whiteSpace: 'pre-line',
  }
}

/**
 * Renders a theme at any size. Slots stack vertically (a growing slot pushes
 * the next one down), anchored inside the safe margins.
 */
export function ThemePreview({
  theme,
  slide,
  selectedSlotId,
  onSelectSlot,
  framed,
}: ThemePreviewProps) {
  const { layout } = theme
  const interactive = Boolean(onSelectSlot)
  const stackRef = useRef<HTMLDivElement>(null)
  const [overflowing, setOverflowing] = useState(false)

  // Warn when the stack no longer fits the screen (only in the editor).
  useLayoutEffect(() => {
    if (!framed || !stackRef.current) return
    const el = stackRef.current
    const check = () => setOverflowing(el.scrollHeight > el.clientHeight + 1)
    check()
    const observer = new ResizeObserver(check)
    observer.observe(el)
    return () => observer.disconnect()
  }, [framed, theme, slide])

  return (
    <div
      className={`@container relative aspect-video w-full overflow-hidden ${BACKGROUND_CLASS[layout.background]} ${
        framed ? 'rounded-md border border-white/10' : ''
      }`}
    >
      {framed && overflowing && (
        <span className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded bg-amber-500/15 px-2 py-1 font-mono text-[10px] tracking-widest text-amber-300 uppercase">
          <AlertTriangle className="h-3 w-3" />
          Overflows the screen
        </span>
      )}
      <div
        ref={stackRef}
        className={`flex h-full w-full flex-col ${ANCHOR_CLASS[layout.anchor]}`}
        style={{
          paddingLeft: cq(layout.paddingX),
          paddingRight: cq(layout.paddingX),
          paddingTop: cq(layout.paddingY),
          paddingBottom: cq(layout.paddingY),
          gap: cq(layout.gap),
        }}
      >
        {theme.slots.map((slot) => {
          const selected = slot.id === selectedSlotId
          const text = slide[slot.field] ?? ''
          const alignSelf =
            slot.style.align === 'left'
              ? 'self-start'
              : slot.style.align === 'right'
                ? 'self-end'
                : 'self-center'
          return (
            <div
              key={slot.id}
              role={interactive ? 'button' : undefined}
              tabIndex={interactive ? 0 : undefined}
              onClick={interactive ? () => onSelectSlot?.(slot.id) : undefined}
              onKeyDown={
                interactive
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') onSelectSlot?.(slot.id)
                    }
                  : undefined
              }
              className={`max-w-full ${alignSelf} ${
                interactive
                  ? 'cursor-pointer rounded-sm outline-offset-4 hover:outline hover:outline-1 hover:outline-white/30'
                  : ''
              } ${selected ? 'outline outline-1 outline-indigo-400' : ''} ${
                slot.style.pill ? 'rounded-[0.6cqw] bg-black/50 px-[1.2cqw] py-[0.6cqw]' : ''
              }`}
              style={slotStyle(slot)}
            >
              {text || <span className="opacity-40">{`{${slot.field}}`}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
