import type { TimelineEntry, TimelineItem } from '../mockData'
import { songSlideCount, type Song } from '../mockSongs'
import type { MediaAsset } from '../mockMedia'

/** Headers that library items are appended to by default. Matched case-insensitively. */
export const SONGS_HEADER = 'Songs'
export const MEDIA_HEADER = 'Media'

function findSectionEnd(entries: TimelineEntry[], headerTitle: string): number {
  const wanted = headerTitle.toLowerCase()
  const headerIndex = entries.findIndex(
    (e) => e.kind === 'header' && e.title.toLowerCase() === wanted,
  )
  if (headerIndex === -1) return entries.length
  const nextHeader = entries.findIndex((e, i) => i > headerIndex && e.kind === 'header')
  return nextHeader === -1 ? entries.length : nextHeader
}

export function insertAt(
  entries: TimelineEntry[],
  index: number,
  item: TimelineEntry,
): TimelineEntry[] {
  const at = Math.max(0, Math.min(index, entries.length))
  return [...entries.slice(0, at), item, ...entries.slice(at)]
}

/**
 * Inserts an item at the end of the given section (just before the next
 * header), or at the end of the timeline when there is no such header.
 */
export function addToSection(
  entries: TimelineEntry[],
  headerTitle: string,
  item: TimelineItem,
): TimelineEntry[] {
  return insertAt(entries, findSectionEnd(entries, headerTitle), item)
}

/**
 * Moves an entry so that it ends up at `toIndex` as counted in the
 * original list (i.e. "drop before the entry currently at toIndex").
 */
export function moveEntry(entries: TimelineEntry[], id: string, toIndex: number): TimelineEntry[] {
  const from = entries.findIndex((e) => e.id === id)
  if (from === -1) return entries
  const without = entries.filter((e) => e.id !== id)
  const at = toIndex > from ? toIndex - 1 : toIndex
  return insertAt(without, at, entries[from])
}

export function timelineHasSong(entries: TimelineEntry[], songId: string): boolean {
  return entries.some((e) => e.kind === 'item' && e.songId === songId)
}

export function timelineHasMedia(entries: TimelineEntry[], mediaId: string): boolean {
  return entries.some((e) => e.kind === 'item' && e.mediaId === mediaId)
}

export function songItem(entries: TimelineEntry[], song: Song): TimelineItem {
  const occurrences = entries.filter((e) => e.kind === 'item' && e.songId === song.id).length
  return {
    kind: 'item',
    id: `${song.id}-${occurrences + 1}`,
    type: 'song',
    title: song.title,
    badge: String(songSlideCount(song)),
    songId: song.id,
  }
}

export function mediaItem(entries: TimelineEntry[], asset: MediaAsset): TimelineItem {
  const occurrences = entries.filter((e) => e.kind === 'item' && e.mediaId === asset.id).length
  return {
    kind: 'item',
    id: `${asset.id}-${occurrences + 1}`,
    type: asset.kind,
    title: asset.name.replace(/\.[^.]+$/, ''),
    badge: asset.kind === 'image' ? '1' : asset.loop ? 'loop' : asset.duration,
    mediaId: asset.id,
  }
}

export function addSongToTimeline(entries: TimelineEntry[], song: Song): TimelineEntry[] {
  return addToSection(entries, SONGS_HEADER, songItem(entries, song))
}

export function addMediaToTimeline(entries: TimelineEntry[], asset: MediaAsset): TimelineEntry[] {
  return addToSection(entries, MEDIA_HEADER, mediaItem(entries, asset))
}
