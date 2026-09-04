import type { TimelineEntry, TimelineItem } from '../mockData'
import { songSlideCount, type Song } from '../mockSongs'

/** Header that songs are appended to by default. Matched case-insensitively. */
export const SONGS_HEADER = 'Songs'

function findSectionEnd(entries: TimelineEntry[], headerTitle: string): number {
  const wanted = headerTitle.toLowerCase()
  const headerIndex = entries.findIndex(
    (e) => e.kind === 'header' && e.title.toLowerCase() === wanted,
  )
  if (headerIndex === -1) return entries.length
  const nextHeader = entries.findIndex((e, i) => i > headerIndex && e.kind === 'header')
  return nextHeader === -1 ? entries.length : nextHeader
}

export function timelineHasSong(entries: TimelineEntry[], songId: string): boolean {
  return entries.some((e) => e.kind === 'item' && e.songId === songId)
}

/**
 * Appends a song to the end of the "Songs" section (just before the next
 * header), or to the end of the timeline when there is no such header.
 */
export function addSongToTimeline(entries: TimelineEntry[], song: Song): TimelineEntry[] {
  const occurrences = entries.filter((e) => e.kind === 'item' && e.songId === song.id).length
  const item: TimelineItem = {
    kind: 'item',
    id: `${song.id}-${occurrences + 1}`,
    type: 'song',
    title: song.title,
    badge: String(songSlideCount(song)),
    songId: song.id,
  }
  const at = findSectionEnd(entries, SONGS_HEADER)
  return [...entries.slice(0, at), item, ...entries.slice(at)]
}
