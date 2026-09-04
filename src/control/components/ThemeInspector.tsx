import type { ReactNode } from 'react'
import { AlignCenter, AlignLeft, AlignRight, ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import {
  COLORS,
  FIELD_LABELS,
  type Align,
  type Anchor,
  type Background,
  type FontFamily,
  type Layout,
  type Slot,
  type SlotStyle,
  type Weight,
} from '../mockThemes'

const FONTS: FontFamily[] = ['Inter', 'Georgia', 'Helvetica Neue', 'Menlo']
const WEIGHTS: { value: Weight; label: string }[] = [
  { value: 400, label: 'Regular' },
  { value: 500, label: 'Medium' },
  { value: 600, label: 'Semibold' },
  { value: 700, label: 'Bold' },
]
const ANCHORS: { value: Anchor; label: string }[] = [
  { value: 'top', label: 'Top' },
  { value: 'center', label: 'Center' },
  { value: 'bottom', label: 'Bottom' },
]
const BACKGROUNDS: { value: Background; label: string }[] = [
  { value: 'inherited', label: 'Inherited' },
  { value: 'dim', label: 'Dim' },
  { value: 'black', label: 'Black' },
]

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-b border-white/8 px-4 py-3">
      <div className="mb-2 font-mono text-[10px] tracking-widest text-neutral-500 uppercase">
        {title}
      </div>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[88px_1fr] items-center gap-2 text-xs text-neutral-400">
      <span>{label}</span>
      {children}
    </div>
  )
}

function Chips<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: ReactNode; title?: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div role="radiogroup" className="flex items-center gap-0.5 rounded-md bg-white/5 p-0.5">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          role="radio"
          aria-checked={opt.value === value}
          title={opt.title}
          onClick={() => onChange(opt.value)}
          className={`flex flex-1 items-center justify-center rounded px-2 py-1 text-xs ${
            opt.value === value
              ? 'bg-white/10 text-neutral-100'
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (value: number) => void
}) {
  return (
    <span className="flex items-center gap-2">
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 flex-1 cursor-pointer accent-indigo-400"
      />
      <span className="w-12 text-right font-mono text-[11px] text-neutral-300">
        {value}
        {unit}
      </span>
    </span>
  )
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`flex items-center justify-between rounded-md border px-2.5 py-1.5 text-xs ${
        value
          ? 'border-indigo-400/50 bg-indigo-500/10 text-neutral-100'
          : 'border-white/10 text-neutral-400 hover:bg-white/5'
      }`}
    >
      {label}
      <span
        className={`h-3.5 w-6 rounded-full p-0.5 transition-colors ${value ? 'bg-indigo-400' : 'bg-white/15'}`}
      >
        <span
          className={`block h-2.5 w-2.5 rounded-full bg-neutral-900 transition-transform ${value ? 'translate-x-2.5' : ''}`}
        />
      </span>
    </button>
  )
}

const selectClass =
  'rounded-md border border-white/10 bg-neutral-900 px-2 py-1 text-xs text-neutral-200 focus:border-indigo-400/60 focus:outline-none'

interface SlotInspectorProps {
  slot: Slot
  index: number
  count: number
  onChange: (style: Partial<SlotStyle>) => void
  onMove: (direction: -1 | 1) => void
  onRemove: () => void
}

export function SlotInspector({
  slot,
  index,
  count,
  onChange,
  onMove,
  onRemove,
}: SlotInspectorProps) {
  const s = slot.style
  return (
    <>
      <Section title="Slot">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-100">{FIELD_LABELS[slot.field]}</span>
          <span className="flex items-center gap-0.5">
            <button
              type="button"
              aria-label="Move up"
              disabled={index === 0}
              onClick={() => onMove(-1)}
              className="flex h-6 w-6 items-center justify-center rounded text-neutral-400 hover:bg-white/10 hover:text-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label="Move down"
              disabled={index === count - 1}
              onClick={() => onMove(1)}
              className="flex h-6 w-6 items-center justify-center rounded text-neutral-400 hover:bg-white/10 hover:text-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label="Remove slot"
              onClick={onRemove}
              className="ml-1 flex h-6 w-6 items-center justify-center rounded text-neutral-500 hover:bg-red-500/20 hover:text-red-300"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </span>
        </div>
        <p className="text-[11px] text-neutral-500">
          Order {index + 1} of {count}. A longer text pushes the slots below it down.
        </p>
      </Section>

      <Section title="Type">
        <Row label="Font">
          <select
            aria-label="Font"
            value={s.fontFamily}
            onChange={(e) => onChange({ fontFamily: e.target.value as FontFamily })}
            className={selectClass}
          >
            {FONTS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </Row>
        <Row label="Size">
          <Slider
            label="Size"
            value={s.size}
            min={24}
            max={140}
            unit="px"
            onChange={(size) => onChange({ size })}
          />
        </Row>
        <Row label="Weight">
          <select
            aria-label="Weight"
            value={s.weight}
            onChange={(e) => onChange({ weight: Number(e.target.value) as Weight })}
            className={selectClass}
          >
            {WEIGHTS.map((w) => (
              <option key={w.value} value={w.value}>
                {w.label}
              </option>
            ))}
          </select>
        </Row>
        <Row label="Line height">
          <Slider
            label="Line height"
            value={s.lineHeight}
            min={0.9}
            max={1.8}
            step={0.05}
            onChange={(lineHeight) => onChange({ lineHeight })}
          />
        </Row>
        <Row label="Align">
          <Chips<Align>
            value={s.align}
            onChange={(align) => onChange({ align })}
            options={[
              { value: 'left', label: <AlignLeft className="h-3.5 w-3.5" />, title: 'Left' },
              { value: 'center', label: <AlignCenter className="h-3.5 w-3.5" />, title: 'Center' },
              { value: 'right', label: <AlignRight className="h-3.5 w-3.5" />, title: 'Right' },
            ]}
          />
        </Row>
        <div className="grid grid-cols-2 gap-2">
          <Toggle label="Italic" value={s.italic} onChange={(italic) => onChange({ italic })} />
          <Toggle
            label="Uppercase"
            value={s.uppercase}
            onChange={(uppercase) => onChange({ uppercase })}
          />
        </div>
      </Section>

      <Section title="Color">
        <Row label="Color">
          <span className="flex items-center gap-1.5">
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={color}
                aria-pressed={s.color === color}
                onClick={() => onChange({ color })}
                style={{ backgroundColor: color }}
                className={`h-5 w-5 rounded-full ring-2 ring-offset-2 ring-offset-neutral-900 ${
                  s.color === color ? 'ring-indigo-400' : 'ring-transparent hover:ring-white/30'
                }`}
              />
            ))}
          </span>
        </Row>
        <Row label="Opacity">
          <Slider
            label="Opacity"
            value={s.opacity}
            min={20}
            max={100}
            unit="%"
            onChange={(opacity) => onChange({ opacity })}
          />
        </Row>
        <div className="grid grid-cols-2 gap-2">
          <Toggle label="Shadow" value={s.shadow} onChange={(shadow) => onChange({ shadow })} />
          <Toggle label="Pill background" value={s.pill} onChange={(pill) => onChange({ pill })} />
        </div>
      </Section>
    </>
  )
}

interface LayoutInspectorProps {
  layout: Layout
  onChange: (layout: Partial<Layout>) => void
}

export function LayoutInspector({ layout, onChange }: LayoutInspectorProps) {
  return (
    <>
      <Section title="Stack">
        <Row label="Anchor">
          <Chips<Anchor>
            value={layout.anchor}
            onChange={(anchor) => onChange({ anchor })}
            options={ANCHORS}
          />
        </Row>
        <Row label="Gap">
          <Slider
            label="Gap"
            value={layout.gap}
            min={0}
            max={120}
            unit="px"
            onChange={(gap) => onChange({ gap })}
          />
        </Row>
        <p className="text-[11px] text-neutral-500">
          Slots stack from the anchor. When one grows, the next moves instead of shrinking.
        </p>
      </Section>
      <Section title="Safe margins">
        <Row label="Sides">
          <Slider
            label="Sides"
            value={layout.paddingX}
            min={0}
            max={400}
            unit="px"
            onChange={(paddingX) => onChange({ paddingX })}
          />
        </Row>
        <Row label="Top / bottom">
          <Slider
            label="Top / bottom"
            value={layout.paddingY}
            min={0}
            max={300}
            unit="px"
            onChange={(paddingY) => onChange({ paddingY })}
          />
        </Row>
      </Section>
      <Section title="Background">
        <Chips<Background>
          value={layout.background}
          onChange={(background) => onChange({ background })}
          options={BACKGROUNDS}
        />
        <p className="text-[11px] text-neutral-500">
          Inherited uses the service item's background. Dim adds a gradient for legibility.
        </p>
      </Section>
    </>
  )
}
