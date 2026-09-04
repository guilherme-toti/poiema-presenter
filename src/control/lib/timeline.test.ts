import { describe, expect, it } from 'vitest'
import type { TimelineEntry } from '../mockData'
import type { Song } from '../mockSongs'
import { addSongToTimeline, timelineHasSong } from './timeline'

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

describe('timelineHasSong', () => {
  it('finds a song by id among items only', () => {
    const entries = [header('way-maker', 'Songs'), item('i1', 'Oceans', 'oceans')]
    expect(timelineHasSong(entries, 'oceans')).toBe(true)
    expect(timelineHasSong(entries, 'way-maker')).toBe(false)
  })
})
