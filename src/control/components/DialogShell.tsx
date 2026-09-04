import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { X } from 'lucide-react'

export interface WindowProps {
  zIndex: number
  focused: boolean
  onFocus: () => void
}

interface DialogShellProps extends WindowProps {
  title: string
  titleId: string
  /** Omit to size the window to its content until the user resizes it. */
  initialWidth?: number
  initialHeight: number
  minWidth?: number
  minHeight?: number
  onClose: () => void
  children: ReactNode
}

type Edge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

const EDGE_CLASS: Record<Edge, string> = {
  n: 'top-0 left-3 right-3 h-1.5 cursor-ns-resize',
  s: 'bottom-0 left-3 right-3 h-1.5 cursor-ns-resize',
  e: 'top-3 bottom-3 right-0 w-1.5 cursor-ew-resize',
  w: 'top-3 bottom-3 left-0 w-1.5 cursor-ew-resize',
  ne: 'top-0 right-0 h-3 w-3 cursor-nesw-resize',
  nw: 'top-0 left-0 h-3 w-3 cursor-nwse-resize',
  se: 'bottom-0 right-0 h-3 w-3 cursor-nwse-resize',
  sw: 'bottom-0 left-0 h-3 w-3 cursor-nesw-resize',
}

interface Point {
  x: number
  y: number
}
interface Size {
  w: number
  h: number
}

/** Keep at least the title bar reachable when a window is dragged off-screen. */
const KEEP_VISIBLE = 48

/**
 * Floating, non-modal window with the app's chrome. Draggable by its title
 * bar, resizable from every edge, closes only through ✕ or Escape (when
 * focused). Opens centered; position and size become explicit once the
 * user moves or resizes it.
 */
export function DialogShell({
  title,
  titleId,
  initialWidth,
  initialHeight,
  minWidth = 480,
  minHeight = 360,
  zIndex,
  focused,
  onFocus,
  onClose,
  children,
}: DialogShellProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<Point | null>(null)
  const [size, setSize] = useState<Size | null>(null)

  useEffect(() => {
    if (!focused) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [focused, onClose])

  const startDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !ref.current) return
    if ((e.target as HTMLElement).closest('button')) return
    const rect = ref.current.getBoundingClientRect()
    const origin = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    e.currentTarget.setPointerCapture(e.pointerId)
    const onMove = (ev: PointerEvent) => {
      setPos({
        x: Math.min(
          Math.max(ev.clientX - origin.x, KEEP_VISIBLE - rect.width),
          window.innerWidth - KEEP_VISIBLE,
        ),
        y: Math.min(Math.max(ev.clientY - origin.y, 0), window.innerHeight - KEEP_VISIBLE),
      })
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const startResize = (edge: Edge) => (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !ref.current) return
    e.preventDefault()
    const start = ref.current.getBoundingClientRect()
    const from = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - from.x
      const dy = ev.clientY - from.y
      let { left: x, top: y, width: w, height: h } = start
      if (edge.includes('e')) w = Math.max(minWidth, start.width + dx)
      if (edge.includes('s')) h = Math.max(minHeight, start.height + dy)
      if (edge.includes('w')) {
        w = Math.max(minWidth, start.width - dx)
        x = start.left + start.width - w
      }
      if (edge.includes('n')) {
        h = Math.max(minHeight, start.height - dy)
        y = start.top + start.height - h
      }
      setPos({ x, y })
      setSize({ w, h })
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const style = {
    zIndex,
    width: size?.w ?? initialWidth,
    height: size?.h ?? initialHeight,
    ...(pos
      ? { left: pos.x, top: pos.y }
      : { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }),
  }

  return (
    <div
      ref={ref}
      role="dialog"
      aria-labelledby={titleId}
      onPointerDownCapture={onFocus}
      style={style}
      className={`fixed flex max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-lg border bg-neutral-900 shadow-2xl shadow-black/60 ${
        focused ? 'border-white/15' : 'border-white/10'
      }`}
    >
      <div
        onPointerDown={startDrag}
        className="flex h-9 shrink-0 cursor-grab items-center justify-between border-b border-white/8 px-3 select-none active:cursor-grabbing"
      >
        <div className="flex items-center gap-2">
          <span className={`h-3 w-3 rounded-sm ${focused ? 'bg-indigo-500' : 'bg-neutral-600'}`} />
          <span
            id={titleId}
            className={`text-xs font-semibold ${focused ? 'text-neutral-200' : 'text-neutral-500'}`}
          >
            {title}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="flex h-6 w-6 items-center justify-center rounded text-neutral-500 hover:bg-red-500/80 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {children}
      {(Object.keys(EDGE_CLASS) as Edge[]).map((edge) => (
        <div
          key={edge}
          aria-hidden
          onPointerDown={startResize(edge)}
          className={`absolute z-10 ${EDGE_CLASS[edge]}`}
        />
      ))}
    </div>
  )
}
