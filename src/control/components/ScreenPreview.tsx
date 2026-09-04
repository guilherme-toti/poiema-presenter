interface ScreenPreviewProps {
  label: string
  aspectLabel: string
  resolutionLabel: string
  caption: string
  liveLines: string[]
  aspectClassName?: string
}

export function ScreenPreview({
  label,
  aspectLabel,
  resolutionLabel,
  caption,
  liveLines,
  aspectClassName = 'aspect-video',
}: ScreenPreviewProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="font-mono text-xs text-neutral-400">
          {label} · {aspectLabel}
        </span>
        <span className="font-mono text-xs text-neutral-600">{resolutionLabel}</span>
      </div>
      <div
        className={`relative flex ${aspectClassName} items-center justify-center overflow-hidden rounded-md border-2 border-red-500 bg-black`}
      >
        <p className="px-4 text-center text-lg font-semibold leading-snug text-white">
          {liveLines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </p>
        <span className="absolute bottom-2 left-2 font-mono text-[10px] text-neutral-500">
          {caption}
        </span>
      </div>
    </div>
  )
}
