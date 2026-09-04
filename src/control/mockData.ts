// Dados estáticos só para a UI ter conteúdo pra mostrar — não é o modelo real
// (isso vem da Fase 2, com SQLite). Servem só para bater com o mockup visual.

export type TimelineItemType = 'countdown' | 'image' | 'song' | 'text'

export interface TimelineItem {
  key: string
  type: TimelineItemType
  title: string
  badge?: string
  selected?: boolean
  sectionAbove?: string
}

export const timelineItems: TimelineItem[] = [
  { key: '01', type: 'countdown', title: 'Countdown 5 min', badge: 'loop' },
  { key: '02', type: 'image', title: 'Welcome', badge: '1' },
  { key: '03', type: 'song', title: 'Oceans', badge: '2/14', selected: true },
  { key: '04', type: 'song', title: 'É Ele', badge: '11' },
  { key: '05', type: 'song', title: 'Free!', badge: '9' },
  { key: '06', type: 'image', title: 'Retreat announcement', badge: '1' },
  { key: '07', type: 'image', title: 'Sermon title art', badge: '1', sectionAbove: 'WORD' },
  { key: '08', type: 'text', title: 'Offering notice', badge: '2' },
  { key: '09', type: 'image', title: 'Closing', badge: '1' },
]

export interface Service {
  id: string
  date: string
  title: string
  createdLabel: string
  items: string[]
  today?: boolean
}

export const recentServices: Service[] = [
  {
    id: 'sep7-am',
    date: 'Sep 7',
    title: 'Sunday Service',
    createdLabel: 'Sep 7, 2026 · created Thu 22:10 · autosaved',
    items: timelineItems.map((item) => item.title),
    today: true,
  },
  {
    id: 'sep7-pm',
    date: 'Sep 7',
    title: 'Evening Service',
    createdLabel: 'Sep 7, 2026 · created Fri 09:32 · autosaved',
    items: ['Countdown 5 min', 'Welcome', 'Free!', 'É Ele', 'Sermon title art', 'Closing'],
  },
  {
    id: 'aug31',
    date: 'Aug 31',
    title: 'Sunday Service',
    createdLabel: 'Aug 31, 2026 · created Thu 21:48 · autosaved',
    items: [
      'Countdown 5 min',
      'Welcome',
      'Oceans',
      'Free!',
      'Baptism announcement',
      'Sermon title art',
      'Offering notice',
      'Closing',
    ],
  },
  {
    id: 'aug24',
    date: 'Aug 24',
    title: 'Youth Night',
    createdLabel: 'Aug 24, 2026 · created Sat 18:05 · autosaved',
    items: ['Countdown 10 min', 'Welcome', 'É Ele', 'Free!', 'Closing'],
  },
  {
    id: 'aug17',
    date: 'Aug 17',
    title: 'Sunday Service',
    createdLabel: 'Aug 17, 2026 · created Thu 22:31 · autosaved',
    items: [
      'Countdown 5 min',
      'Welcome',
      'Oceans',
      'É Ele',
      'Retreat announcement',
      'Sermon title art',
      'Offering notice',
      'Closing',
    ],
  },
]

export type SlideState = 'normal' | 'live' | 'next'

export interface SlideRowData {
  key: string
  part: string
  text: string
  state: SlideState
  dimmed?: boolean
  trailingLabel?: string
}

export const currentSongSlides: SlideRowData[] = [
  { key: '1', part: 'Verse 1', text: 'You call me out / upon the waters', state: 'normal' },
  { key: '2', part: 'Verse 1', text: 'where feet may fail / and there I find You', state: 'live' },
  { key: '3', part: 'Verse 1', text: 'in the mystery / in oceans deep', state: 'next' },
  { key: '4', part: 'Chorus', text: 'my faith will stand / and I will call upon', state: 'normal' },
  { key: '5', part: 'Chorus', text: 'Your name on me / keep my eyes above', state: 'normal' },
  { key: '6', part: 'Chorus', text: 'the waves and sea / through the storm', state: 'normal' },
  { key: '7', part: 'Bridge', text: 'Spirit lead me / where my trust is', state: 'normal' },
  { key: '8', part: 'Bridge', text: 'without borders / let me walk upon', state: 'normal' },
  { key: '9', part: 'Bridge', text: 'the waters, wherever / You would call me', state: 'normal' },
  {
    key: '·',
    part: 'Chorus',
    text: 'my faith will stand / and I will call upon',
    state: 'normal',
    dimmed: true,
    trailingLabel: '10',
  },
]
