import { EyeOff, Eraser } from 'lucide-react'
import { ScreenPreview } from '../components/ScreenPreview'

export function RightPanel() {
  return (
    <div className="flex flex-col gap-4 border-l border-white/8 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs tracking-widest text-neutral-400">LIVE · 1 SCREEN</span>
        <span className="flex items-center gap-1.5 font-mono text-xs font-semibold text-red-400">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          ON AIR
        </span>
      </div>

      <ScreenPreview
        label="Main"
        aspectLabel="16:9"
        resolutionLabel="1920×1080"
        caption="still frame · countdown-5min.mp4"
        liveLines={['where feet may fail', 'and there I find You']}
      />

      <div className="flex-1" />

      <button className="flex items-center justify-center gap-2 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-300 hover:bg-red-500/20">
        <EyeOff className="h-4 w-4" />
        Black screen — both
        <span className="ml-auto font-mono text-xs text-red-400/70">B</span>
      </button>
      <button className="flex items-center justify-center gap-2 rounded-md border border-white/10 px-4 py-2.5 text-sm font-medium text-neutral-300 hover:bg-white/5">
        <Eraser className="h-4 w-4" />
        Clear text
        <span className="ml-auto font-mono text-xs text-neutral-500">C</span>
      </button>
    </div>
  )
}
