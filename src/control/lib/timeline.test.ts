import { describe, expect, it } from 'vitest'
import type { TimelineEntry } from '../mockData'
import type { Song } from '../mockSongs'
import type { MediaAsset } from '../mockMedia'
import {
  addMediaToTimeline,
  addSongToTimeline,
  insertAt,
  moveEntry,
  timelineHasMedia,
  timelineHasSong,
} from './timeline'

const video: MediaAsset = {
  id: 'loop-blue',
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
}

const song: Song = {
  id: 'way-maker',
  title: 'Way Maker',
  artist: 'Sinach',
  lastUsed: '2026-08-31',
  sections: [{ label: 'Chorus', lines: ['a', 'b', 'c'] }],
}

const header = (id: string, title: string): TimelineEntry => ({ kind: 'header', id, title })
const item = (id: string, title: string, songId?: string): TimelineEntry => ({
  kind: 'item',
  id,
  type: 'song',
  title,
  songId,
})

const titles = (entries: TimelineEntry[]) => entries.map((e) => e.title)

describe('addSongToTimeline', () => {
  it('inserts at the end of the Songs section, before the next header', () => {
    const entries = [
      header('h1', 'Media'),
      item('i1', 'Welcome'),
      header('h2', 'Songs'),
      item('i2', 'Oceans'),
      header('h3', 'WORD'),
      item('i3', 'Closing'),
    ]
    expect(titles(addSongToTimeline(entries, song))).toEqual([
      'Media',
      'Welcome',
      'Songs',
      'Oceans',
      'Way Maker',
      'WORD',
      'Closing',
    ])
  })

  it('appends to the end when Songs is the last section', () => {
    const entries = [header('h1', 'Songs'), item('i1', 'Oceans')]
    expect(titles(addSongToTimeline(entries, song))).toEqual(['Songs', 'Oceans', 'Way Maker'])
  })

  it('appends to the end when there is no Songs header', () => {
    const entries = [header('h1', 'Media'), item('i1', 'Welcome')]
    expect(titles(addSongToTimeline(entries, song))).toEqual(['Media', 'Welcome', 'Way Maker'])
  })

  it('matches the header case-insensitively', () => {
    const entries = [header('h1', 'SONGS'), header('h2', 'WORD')]
    expect(titles(addSongToTimeline(entries, song))).toEqual(['SONGS', 'Way Maker', 'WORD'])
  })

  it('gives repeated additions unique ids and a slide-count badge', () => {
    const once = addSongToTimeline([header('h1', 'Songs')], song)
    const twice = addSongToTimeline(once, song)
    const ids = twice.filter((e) => e.kind === 'item').map((e) => e.id)
    expect(ids).toEqual(['way-maker-1', 'way-maker-2'])
    expect(twice[1]).toMatchObject({ badge: '2', songId: 'way-maker' })
  })

  it('does not mutate the input', () => {
    const entries = [header('h1', 'Songs')]
    addSongToTimeline(entries, song)
    expect(entries).toHaveLength(1)
  })
})

describe('addMediaToTimeline', () => {
  it('inserts at the end of the Media section with a loop badge and no extension', () => {
    const entries = [
      header('h1', 'Media'),
      item('i1', 'Welcome'),
      header('h2', 'Songs'),
      item('i2', 'Oceans'),
    ]
    const result = addMediaToTimeline(entries, video)
    expect(titles(result)).toEqual(['Media', 'Welcome', 'worship-loop-blue', 'Songs', 'Oceans'])
    expect(result[2]).toMatchObject({ type: 'video', badge: 'loop', mediaId: 'loop-blue' })
  })

  it('uses the duration as badge for non-looping videos and "1" for images', () => {
    const clip = addMediaToTimeline([], { ...video, loop: false })
    const image = addMediaToTimeline([], { ...video, kind: 'image', name: 'welcome.jpg' })
    expect(clip[0]).toMatchObject({ badge: '0:30' })
    expect(image[0]).toMatchObject({ type: 'image', title: 'welcome', badge: '1' })
  })
})

describe('timelineHasMedia', () => {
  it('finds an asset by mediaId', () => {
    const entries = addMediaToTimeline([header('h1', 'Media')], video)
    expect(timelineHasMedia(entries, 'loop-blue')).toBe(true)
    expect(timelineHasMedia(entries, 'other')).toBe(false)
  })
})

describe('moveEntry', () => {
  const entries = [
    header('h1', 'Media'),
    item('a', 'A'),
    item('b', 'B'),
    header('h2', 'Songs'),
    item('c', 'C'),
  ]

  it('moves an entry down, dropping before the entry that was at toIndex', () => {
    expect(titles(moveEntry(entries, 'a', 4))).toEqual(['Media', 'B', 'Songs', 'A', 'C'])
  })

  it('moves an entry up', () => {
    expect(titles(moveEntry(entries, 'c', 1))).toEqual(['Media', 'C', 'A', 'B', 'Songs'])
  })

  it('moves to the very end', () => {
    expect(titles(moveEntry(entries, 'a', 5))).toEqual(['Media', 'B', 'Songs', 'C', 'A'])
  })

  it('is a no-op when dropped onto its own position', () => {
    expect(titles(moveEntry(entries, 'b', 2))).toEqual(titles(entries))
    expect(titles(moveEntry(entries, 'b', 3))).toEqual(titles(entries))
  })

  it('ignores unknown ids', () => {
    expect(moveEntry(entries, 'nope', 0)).toBe(entries)
  })
})

describe('insertAt', () => {
  it('clamps the index to the list bounds', () => {
    const entries = [item('a', 'A')]
    expect(titles(insertAt(entries, -3, item('b', 'B')))).toEqual(['B', 'A'])
    expect(titles(insertAt(entries, 99, item('b', 'B')))).toEqual(['A', 'B'])
  })
})

describe('timelineHasSong', () => {
  it('finds a song by id among items only', () => {
    const entries = [header('way-maker', 'Songs'), item('i1', 'Oceans', 'oceans')]
    expect(timelineHasSong(entries, 'oceans')).toBe(true)
    expect(timelineHasSong(entries, 'way-maker')).toBe(false)
  })
})
