// Biblioteca de mídia mockada para a UI. Não há arquivos reais: `src` fica
// vazio e os thumbnails usam um placeholder listrado.

export type MediaKind = 'video' | 'image'
export type MediaStatus = 'ok' | 'may-not-play' | 'missing'

export interface MediaAsset {
  id: string
  name: string
  kind: MediaKind
  format: string
  /** "m:ss" for videos. */
  duration?: string
  loop?: boolean
  codec?: string
  status: MediaStatus
  resolution: string
  size: string
  /** ISO date of the last service this asset was used in. */
  lastUsed: string
  usedIn: number
  /** Optional real file; when present, thumbnails and the preview play it. */
  src?: string
}

const normalize = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export const searchMedia = (
  list: MediaAsset[],
  query: string,
  kind: MediaKind | 'all',
): MediaAsset[] => {
  const q = normalize(query.trim())
  return list.filter(
    (asset) => (kind === 'all' || asset.kind === kind) && (!q || normalize(asset.name).includes(q)),
  )
}

/** Short badge shown on the thumbnail, e.g. "MP4 · 5:00", "MOV · HEVC", "JPG". */
export const mediaBadge = (asset: MediaAsset): string => {
  const parts = [asset.format]
  if (asset.codec) parts.push(asset.codec)
  else if (asset.loop) parts.push('loop')
  else if (asset.duration) parts.push(asset.duration)
  return parts.join(' · ')
}

export const media: MediaAsset[] = [
  {
    id: 'countdown-5min',
    name: 'countdown-5min.mp4',
    kind: 'video',
    format: 'MP4',
    duration: '5:00',
    status: 'ok',
    resolution: '1920×1080',
    size: '42 MB',
    lastUsed: '2026-09-07',
    usedIn: 6,
  },
  {
    id: 'welcome-poiema',
    name: 'welcome-poiema.jpg',
    kind: 'image',
    format: 'JPG',
    status: 'ok',
    resolution: '1920×1080',
    size: '1.2 MB',
    lastUsed: '2026-09-07',
    usedIn: 6,
  },
  {
    id: 'retiro-teaser',
    name: 'retiro-teaser.mov',
    kind: 'video',
    format: 'MOV',
    duration: '0:48',
    codec: 'HEVC',
    status: 'may-not-play',
    resolution: '3840×2160',
    size: '310 MB',
    lastUsed: '2026-08-31',
    usedIn: 1,
  },
  {
    id: 'worship-loop-blue',
    name: 'worship-loop-blue.mp4',
    kind: 'video',
    format: 'MP4',
    duration: '0:30',
    loop: true,
    status: 'ok',
    resolution: '1920×1080',
    size: '18 MB',
    lastUsed: '2026-08-31',
    usedIn: 4,
  },
  {
    id: 'sermon-art',
    name: 'sermon-art.png',
    kind: 'image',
    format: 'PNG',
    status: 'missing',
    resolution: '1920×1080',
    size: '2.8 MB',
    lastUsed: '2026-09-07',
    usedIn: 3,
  },
  {
    id: 'closing',
    name: 'closing.jpg',
    kind: 'image',
    format: 'JPG',
    status: 'ok',
    resolution: '1920×1080',
    size: '0.9 MB',
    lastUsed: '2026-09-07',
    usedIn: 5,
  },
  {
    id: 'retreat-2026',
    name: 'retreat-2026.jpg',
    kind: 'image',
    format: 'JPG',
    status: 'ok',
    resolution: '1920×1080',
    size: '1.5 MB',
    lastUsed: '2026-09-07',
    usedIn: 2,
  },
  {
    id: 'ambient-particles',
    name: 'ambient-particles.mp4',
    kind: 'video',
    format: 'MP4',
    duration: '1:00',
    loop: true,
    status: 'ok',
    resolution: '1920×1080',
    size: '55 MB',
    lastUsed: '2026-08-24',
    usedIn: 3,
  },
  {
    id: 'baptism-announcement',
    name: 'baptism-announcement.png',
    kind: 'image',
    format: 'PNG',
    status: 'ok',
    resolution: '1920×1080',
    size: '2.1 MB',
    lastUsed: '2026-08-31',
    usedIn: 1,
  },
]
