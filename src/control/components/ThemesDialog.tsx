import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Copy, Plus, Star, Trash2 } from 'lucide-react'
import {
  FIELD_LABELS,
  FIELDS_BY_TYPE,
  SAMPLES_BY_TYPE,
  TYPE_LABELS,
  themes as initialThemes,
  type Layout,
  type Slot,
  type SlotField,
  type SlotStyle,
  type Theme,
  type ThemeType,
} from '../mockThemes'
import { DialogShell, type WindowProps } from './DialogShell'
import { ThemePreview } from './ThemePreview'
import { LayoutInspector, SlotInspector } from './ThemeInspector'

const TYPES: ThemeType[] = ['song', 'bible', 'text']

interface ThemesDialogProps extends WindowProps {
  onClose: () => void
}

export function ThemesDialog({ onClose, ...windowProps }: ThemesDialogProps) {
  const [themes, setThemes] = useState<Theme[]>(initialThemes)
  const [themeId, setThemeId] = useState(initialThemes[0].id)
  const [slotId, setSlotId] = useState<string | null>(initialThemes[0].slots[0].id)
  const [sampleId, setSampleId] = useState<string>(SAMPLES_BY_TYPE.song[0].id)
  const [slideIndex, setSlideIndex] = useState(0)
  const [addingSlot, setAddingSlot] = useState(false)
  // Opens at 70% of the app window; the editor needs room for the preview.
  const [initialSize] = useState(() => ({
    w: Math.round(window.innerWidth * 0.7),
    h: Math.round(window.innerHeight * 0.7),
  }))
  const idCounter = useRef(0)
  const nextId = (prefix: string) => `${prefix}-${++idCounter.current}`

  const theme = themes.find((t) => t.id === themeId) ?? themes[0]
  const samples = SAMPLES_BY_TYPE[theme.type]
  const sample = samples.find((s) => s.id === sampleId) ?? samples[0]
  const slide = sample.slides[Math.min(slideIndex, sample.slides.length - 1)]
  const slot = theme.slots.find((s) => s.id === slotId) ?? null
  const slotIndex = slot ? theme.slots.indexOf(slot) : -1
  const unusedFields = FIELDS_BY_TYPE[theme.type].filter(
    (field) => !theme.slots.some((s) => s.field === field),
  )

  const updateTheme = (id: string, patch: (theme: Theme) => Theme) =>
    setThemes((all) => all.map((t) => (t.id === id ? patch(t) : t)))

  const selectTheme = (next: Theme) => {
    setThemeId(next.id)
    setSlotId(next.slots[0]?.id ?? null)
    if (next.type !== theme.type) {
      setSampleId(SAMPLES_BY_TYPE[next.type][0].id)
      setSlideIndex(0)
    }
    setAddingSlot(false)
  }

  const changeSlotStyle = (style: Partial<SlotStyle>) => {
    if (!slot) return
    updateTheme(theme.id, (t) => ({
      ...t,
      slots: t.slots.map((s) => (s.id === slot.id ? { ...s, style: { ...s.style, ...style } } : s)),
    }))
  }

  const moveSlot = (direction: -1 | 1) => {
    if (!slot) return
    updateTheme(theme.id, (t) => {
      const from = t.slots.indexOf(slot)
      const to = from + direction
      if (to < 0 || to >= t.slots.length) return t
      const slots = [...t.slots]
      slots.splice(from, 1)
      slots.splice(to, 0, slot)
      return { ...t, slots }
    })
  }

  const removeSlot = () => {
    if (!slot) return
    updateTheme(theme.id, (t) => ({ ...t, slots: t.slots.filter((s) => s.id !== slot.id) }))
    setSlotId(null)
  }

  const addSlot = (field: SlotField) => {
    const template = theme.slots[theme.slots.length - 1]?.style ?? initialThemes[0].slots[0].style
    const next: Slot = { id: nextId(`${theme.id}-${field}`), field, style: { ...template } }
    updateTheme(theme.id, (t) => ({ ...t, slots: [...t.slots, next] }))
    setSlotId(next.id)
    setAddingSlot(false)
  }

  const changeLayout = (layout: Partial<Layout>) =>
    updateTheme(theme.id, (t) => ({ ...t, layout: { ...t.layout, ...layout } }))

  const setDefault = (target: Theme) =>
    setThemes((all) =>
      all.map((t) => (t.type === target.type ? { ...t, isDefault: t.id === target.id } : t)),
    )

  const duplicateTheme = () => {
    const copy: Theme = {
      ...theme,
      id: nextId(`${theme.id}-copy`),
      name: `${theme.name} copy`,
      isDefault: false,
      slots: theme.slots.map((s) => ({ ...s, style: { ...s.style } })),
    }
    setThemes((all) => [...all, copy])
    selectTheme(copy)
  }

  const deleteTheme = () => {
    if (theme.isDefault) return
    const remaining = themes.filter((t) => t.id !== theme.id)
    setThemes(remaining)
    selectTheme(remaining.find((t) => t.type === theme.type) ?? remaining[0])
  }

  return (
    <DialogShell
      title="Themes"
      titleId="themes-dialog-title"
      initialWidth={initialSize.w}
      initialHeight={initialSize.h}
      minWidth={960}
      minHeight={600}
      onClose={onClose}
      {...windowProps}
    >
      <div className="grid flex-1 grid-cols-[220px_1fr_340px] overflow-hidden">
        {/* Themes list */}
        <div className="flex flex-col overflow-y-auto border-r border-white/8 p-2">
          {TYPES.map((type) => (
            <div key={type} className="mb-3">
              <div className="px-2 pb-1 font-mono text-[10px] tracking-widest text-neutral-500 uppercase">
                {TYPE_LABELS[type]}
              </div>
              {themes
                .filter((t) => t.type === type)
                .map((t) => {
                  const active = t.id === theme.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => selectTheme(t)}
                      aria-current={active || undefined}
                      className={`group flex w-full items-center gap-2 rounded-md border p-1.5 text-left ${
                        active
                          ? 'border-indigo-400/60 bg-white/5'
                          : 'border-transparent hover:bg-white/5'
                      }`}
                    >
                      <span className="w-16 shrink-0 overflow-hidden rounded-sm">
                        <ThemePreview theme={t} slide={SAMPLES_BY_TYPE[type][0].slides[0]} />
                      </span>
                      <span
                        className={`flex-1 truncate text-sm ${active ? 'text-neutral-100' : 'text-neutral-300'}`}
                      >
                        {t.name}
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label={t.isDefault ? 'Default theme' : 'Set as default'}
                        onClick={(e) => {
                          e.stopPropagation()
                          setDefault(t)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation()
                            setDefault(t)
                          }
                        }}
                        className={`flex h-5 w-5 items-center justify-center rounded ${
                          t.isDefault
                            ? 'text-amber-300'
                            : 'text-transparent group-hover:text-neutral-600 hover:text-amber-300!'
                        }`}
                      >
                        <Star
                          className="h-3.5 w-3.5"
                          fill={t.isDefault ? 'currentColor' : 'none'}
                        />
                      </span>
                    </button>
                  )
                })}
            </div>
          ))}
          <button
            type="button"
            className="mt-auto flex items-center justify-center gap-2 rounded-md border border-white/15 px-3 py-2 text-sm font-medium text-neutral-200 hover:border-white/25 hover:bg-white/5"
          >
            <Plus className="h-4 w-4" />
            New theme
          </button>
        </div>

        {/* Preview */}
        <div className="flex min-w-0 flex-col overflow-hidden bg-neutral-950/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">{theme.name}</h3>
              <p className="font-mono text-[11px] text-neutral-500">
                {TYPE_LABELS[theme.type]}
                {theme.isDefault ? ' · default' : ''}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={duplicateTheme}
                className="flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-neutral-300 hover:bg-white/5"
              >
                <Copy className="h-3.5 w-3.5" />
                Duplicate
              </button>
              <button
                type="button"
                onClick={deleteTheme}
                disabled={theme.isDefault}
                title={theme.isDefault ? 'The default theme cannot be deleted' : undefined}
                className="flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-neutral-300 hover:bg-white/5 disabled:text-neutral-600 disabled:hover:bg-transparent"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </div>

          <div className="flex flex-1 items-center">
            <ThemePreview
              theme={theme}
              slide={slide}
              selectedSlotId={slotId}
              onSelectSlot={(id) => {
                setSlotId(id)
                setAddingSlot(false)
              }}
              framed
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-widest text-neutral-500 uppercase">
                Sample
              </span>
              <div
                role="radiogroup"
                className="flex items-center gap-0.5 rounded-md bg-white/5 p-0.5"
              >
                {samples.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    role="radio"
                    aria-checked={s.id === sample.id}
                    onClick={() => {
                      setSampleId(s.id)
                      setSlideIndex(0)
                    }}
                    className={`rounded px-2 py-1 text-xs ${
                      s.id === sample.id
                        ? 'bg-white/10 text-neutral-100'
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              {sample.slides.length > 1 && (
                <span className="flex items-center gap-1 font-mono text-[11px] text-neutral-500">
                  <button
                    type="button"
                    aria-label="Previous slide"
                    onClick={() => setSlideIndex((i) => Math.max(0, i - 1))}
                    className="rounded p-0.5 hover:bg-white/10 hover:text-neutral-200"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  {slideIndex + 1}/{sample.slides.length}
                  <button
                    type="button"
                    aria-label="Next slide"
                    onClick={() => setSlideIndex((i) => Math.min(sample.slides.length - 1, i + 1))}
                    className="rounded p-0.5 hover:bg-white/10 hover:text-neutral-200"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] tracking-widest text-neutral-500 uppercase">
                Slots
              </span>
              {theme.slots.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={s.id === slotId}
                  onClick={() => {
                    setSlotId(s.id)
                    setAddingSlot(false)
                  }}
                  className={`rounded-full border px-2.5 py-1 text-xs ${
                    s.id === slotId
                      ? 'border-indigo-400/60 bg-indigo-500/10 text-neutral-100'
                      : 'border-white/10 text-neutral-400 hover:bg-white/5'
                  }`}
                >
                  <span className="mr-1 font-mono text-[10px] text-neutral-500">{i + 1}</span>
                  {FIELD_LABELS[s.field]}
                </button>
              ))}
              <div className="relative">
                <button
                  type="button"
                  aria-label="Add slot"
                  aria-expanded={addingSlot}
                  disabled={unusedFields.length === 0}
                  onClick={() => setAddingSlot((v) => !v)}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-white/20 text-neutral-400 hover:border-white/40 hover:text-neutral-100 disabled:opacity-30"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                {addingSlot && (
                  <div
                    role="menu"
                    className="absolute right-0 bottom-full z-10 mb-1 w-44 rounded-md border border-white/10 bg-neutral-900 p-1 shadow-xl shadow-black/50"
                  >
                    {unusedFields.map((field) => (
                      <button
                        key={field}
                        type="button"
                        role="menuitem"
                        onClick={() => addSlot(field)}
                        className="block w-full rounded px-2 py-1.5 text-left text-xs text-neutral-200 hover:bg-white/10"
                      >
                        {FIELD_LABELS[field]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Inspector */}
        <div className="flex flex-col overflow-x-hidden overflow-y-auto border-l border-white/8">
          {slot ? (
            <SlotInspector
              slot={slot}
              index={slotIndex}
              count={theme.slots.length}
              onChange={changeSlotStyle}
              onMove={moveSlot}
              onRemove={removeSlot}
            />
          ) : (
            <div className="border-b border-white/8 px-4 py-3 text-xs text-neutral-500">
              Select a slot in the preview to style it.
            </div>
          )}
          <LayoutInspector layout={theme.layout} onChange={changeLayout} />
        </div>
      </div>
    </DialogShell>
  )
}
