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

/**
 * Inserts an item at the end of the given section (just before the next
 * header), or at the end of the timeline when there is no such header.
 */
export function addToSection(
  entries: TimelineEntry[],
  headerTitle: string,
  item: TimelineItem,
): TimelineEntry[] {
  const at = findSectionEnd(entries, headerTitle)
  return [...entries.slice(0, at), item, ...entries.slice(at)]
}

export function timelineHasSong(entries: TimelineEntry[], songId: string): boolean {
  return entries.some((e) => e.kind === 'item' && e.songId === songId)
}

export function timelineHasMedia(entries: TimelineEntry[], mediaId: string): boolean {
  return entries.some((e) => e.kind === 'item' && e.mediaId === mediaId)
}

export function addSongToTimeline(entries: TimelineEntry[], song: Song): TimelineEntry[] {
  const occurrences = entries.filter((e) => e.kind === 'item' && e.songId === song.id).length
  return addToSection(entries, SONGS_HEADER, {
    kind: 'item',
    id: `${song.id}-${occurrences + 1}`,
    type: 'song',
    title: song.title,
    badge: String(songSlideCount(song)),
    songId: song.id,
  })
}

export function addMediaToTimeline(entries: TimelineEntry[], asset: MediaAsset): TimelineEntry[] {
  const occurrences = entries.filter((e) => e.kind === 'item' && e.mediaId === asset.id).length
  return addToSection(entries, MEDIA_HEADER, {
    kind: 'item',
    id: `${asset.id}-${occurrences + 1}`,
    type: asset.kind,
    title: asset.name.replace(/\.[^.]+$/, ''),
    badge: asset.kind === 'image' ? '1' : asset.loop ? 'loop' : asset.duration,
    mediaId: asset.id,
  })
}
