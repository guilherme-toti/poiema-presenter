// Dados estáticos só para a UI ter conteúdo pra mostrar — não é o modelo real
// (isso vem da Fase 2, com SQLite). Servem só para bater com o mockup visual.
// As letras são inventadas: são placeholders, não letras reais.

export type TimelineItemType = 'countdown' | 'image' | 'song' | 'text'

export interface TimelineHeader {
  kind: 'header'
  id: string
  title: string
}

export interface TimelineItem {
  kind: 'item'
  id: string
  type: TimelineItemType
  title: string
  badge?: string
  songId?: string
}

export type TimelineEntry = TimelineHeader | TimelineItem

/** Headers created with every new service, in order. */
export const DEFAULT_HEADERS = ['Media', 'Songs']

export const timelineEntries: TimelineEntry[] = [
  { kind: 'header', id: 'h-media', title: 'Media' },
  { kind: 'item', id: 'countdown', type: 'countdown', title: 'Countdown 5 min', badge: 'loop' },
  { kind: 'item', id: 'welcome', type: 'image', title: 'Welcome', badge: '1' },
  { kind: 'item', id: 'retreat', type: 'image', title: 'Retreat announcement', badge: '1' },
  { kind: 'header', id: 'h-songs', title: 'Songs' },
  { kind: 'item', id: 'oceans-1', type: 'song', title: 'Oceans', badge: '2/14', songId: 'oceans' },
  { kind: 'item', id: 'e-ele-1', type: 'song', title: 'É Ele', badge: '11', songId: 'e-ele' },
  { kind: 'item', id: 'free-1', type: 'song', title: 'Free!', badge: '9', songId: 'free' },
  { kind: 'header', id: 'h-word', title: 'WORD' },
  { kind: 'item', id: 'sermon-art', type: 'image', title: 'Sermon title art', badge: '1' },
  { kind: 'item', id: 'offering', type: 'text', title: 'Offering notice', badge: '2' },
  { kind: 'item', id: 'closing', type: 'image', title: 'Closing', badge: '1' },
]

export const timelineItemsOf = (entries: TimelineEntry[]): TimelineItem[] =>
  entries.filter((e): e is TimelineItem => e.kind === 'item')

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
    items: timelineItemsOf(timelineEntries).map((item) => item.title),
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
  { key: '1', part: 'Verse 1', text: 'Over quiet water / Your voice is calling', state: 'normal' },
  {
    key: '2',
    part: 'Verse 1',
    text: 'Every step is trembling / still I keep on walking',
    state: 'live',
  },
  {
    key: '3',
    part: 'Verse 1',
    text: 'Deeper than my knowing / wider than my seeing',
    state: 'next',
  },
  { key: '4', part: 'Chorus', text: 'I will hold on / when the waves are rising', state: 'normal' },
  {
    key: '5',
    part: 'Chorus',
    text: 'You are the anchor / that will not be moving',
    state: 'normal',
  },
  { key: '6', part: 'Chorus', text: 'Through every storm / my heart is resting', state: 'normal' },
  {
    key: '7',
    part: 'Bridge',
    text: 'Take me further / than my feet would wander',
    state: 'normal',
  },
  { key: '8', part: 'Bridge', text: 'Past the edges / of the shore I know', state: 'normal' },
  {
    key: '9',
    part: 'Bridge',
    text: 'Where my courage / learns to trust You fully',
    state: 'normal',
  },
  {
    key: '·',
    part: 'Chorus',
    text: 'I will hold on / when the waves are rising',
    state: 'normal',
    dimmed: true,
    trailingLabel: '10',
  },
]
