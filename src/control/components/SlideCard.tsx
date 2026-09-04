import type { SlideRowData } from '../mockData'

const STATE_LABEL: Record<SlideRowData['state'], { text: string; className: string } | null> = {
  live: { text: 'On air', className: 'text-red-400' },
  next: { text: 'Selected', className: 'text-indigo-300' },
  normal: null,
}

const CARD_STATE_CLASS: Record<SlideRowData['state'], string> = {
  live: 'border-red-500 bg-red-500/10 text-neutral-50',
  next: 'border-indigo-400 bg-white/5 text-neutral-50',
  normal: 'border-white/8 bg-white/5 text-neutral-200 hover:bg-white/8',
}

export function SlideCard({ slide }: { slide: SlideRowData }) {
  const stateLabel = STATE_LABEL[slide.state]
  const lines = slide.text.split(' / ')

  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border p-4 ${CARD_STATE_CLASS[slide.state]} ${
        slide.dimmed ? 'opacity-40' : ''
      }`}
    >
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest">
        <span className="text-neutral-500">
          {slide.part}
          {stateLabel && (
            <>
              <span className="text-neutral-600"> · </span>
              <span className={stateLabel.className}>{stateLabel.text}</span>
            </>
          )}
        </span>
        <span className={stateLabel?.className ?? 'text-neutral-500'}>
          {slide.trailingLabel ?? slide.key}
        </span>
      </div>
      <p className="text-base leading-snug">
        {lines.map((line, i) => (
          <span key={i} className="block">
            {line}
          </span>
        ))}
      </p>
    </div>
  )
}
