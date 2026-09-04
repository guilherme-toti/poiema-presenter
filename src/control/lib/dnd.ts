import type { DragEvent } from 'react'

export type DragPayload =
  | { source: 'song'; id: string }
  | { source: 'media'; id: string }
  | { source: 'timeline'; id: string }

const MIME = 'application/x-poiema'

export function setDragPayload(e: DragEvent, payload: DragPayload) {
  e.dataTransfer.setData(MIME, JSON.stringify(payload))
  e.dataTransfer.effectAllowed = payload.source === 'timeline' ? 'move' : 'copy'
}

export function hasDragPayload(e: DragEvent): boolean {
  return e.dataTransfer.types.includes(MIME)
}

export function getDragPayload(e: DragEvent): DragPayload | null {
  const raw = e.dataTransfer.getData(MIME)
  if (!raw) return null
  try {
    return JSON.parse(raw) as DragPayload
  } catch {
    return null
  }
}
