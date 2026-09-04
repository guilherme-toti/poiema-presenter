// Temas (aparências) mockados. Um tema é uma pilha de slots ligados a campos
// do conteúdo. Medidas em px num canvas de referência de 1920×1080.

export type ThemeType = 'song' | 'bible' | 'text'

export type SlotField =
  | 'lyrics.pt'
  | 'lyrics.en'
  | 'song.title'
  | 'bible.text'
  | 'bible.reference'
  | 'text.body'
  | 'text.title'

export const FIELD_LABELS: Record<SlotField, string> = {
  'lyrics.pt': 'Lyrics · PT',
  'lyrics.en': 'Lyrics · EN',
  'song.title': 'Song title',
  'bible.text': 'Verse text',
  'bible.reference': 'Reference',
  'text.body': 'Body',
  'text.title': 'Title',
}

export const FIELDS_BY_TYPE: Record<ThemeType, SlotField[]> = {
  song: ['lyrics.pt', 'lyrics.en', 'song.title'],
  bible: ['bible.text', 'bible.reference'],
  text: ['text.title', 'text.body'],
}

export const TYPE_LABELS: Record<ThemeType, string> = {
  song: 'Songs',
  bible: 'Bible',
  text: 'Texts',
}

export type FontFamily = 'Inter' | 'Georgia' | 'Helvetica Neue' | 'Menlo'
export type Weight = 400 | 500 | 600 | 700
export type Align = 'left' | 'center' | 'right'

export interface SlotStyle {
  fontFamily: FontFamily
  /** Font size in px at 1080p. */
  size: number
  weight: Weight
  italic: boolean
  uppercase: boolean
  color: string
  align: Align
  lineHeight: number
  /** 0–100 */
  opacity: number
  shadow: boolean
  /** Shadow blur radius in px at 1080p. */
  shadowBlur: number
  /** Vertical shadow distance in px at 1080p. */
  shadowDistance: number
  /** 0–100 */
  shadowOpacity: number
  /** Translucent pill behind the text, for busy backgrounds. */
  pill: boolean
  /** 0–100 */
  pillOpacity: number
  /** Horizontal padding in px at 1080p (vertical is half). */
  pillPadding: number
  /** Corner radius in px at 1080p. */
  pillRadius: number
}

export interface Slot {
  id: string
  field: SlotField
  style: SlotStyle
}

export type Anchor = 'top' | 'center' | 'bottom'
export type Background = 'inherited' | 'black' | 'dim'

export interface Layout {
  anchor: Anchor
  /** Safe margins in px at 1080p. */
  paddingX: number
  paddingY: number
  /** Space between slots in px at 1080p. */
  gap: number
  background: Background
}

export interface Theme {
  id: string
  type: ThemeType
  name: string
  isDefault: boolean
  layout: Layout
  slots: Slot[]
}

export const COLORS = ['#ffffff', '#e5e5e5', '#a3a3a3', '#fde68a', '#a5b4fc', '#fca5a5']

const base: SlotStyle = {
  fontFamily: 'Inter',
  size: 72,
  weight: 600,
  italic: false,
  uppercase: false,
  color: '#ffffff',
  align: 'center',
  lineHeight: 1.2,
  opacity: 100,
  shadow: true,
  shadowBlur: 16,
  shadowDistance: 4,
  shadowOpacity: 70,
  pill: false,
  pillOpacity: 50,
  pillPadding: 24,
  pillRadius: 12,
}

const translation: SlotStyle = {
  ...base,
  size: 56,
  weight: 400,
  italic: true,
  opacity: 75,
}

export const themes: Theme[] = [
  {
    id: 'song-default',
    type: 'song',
    name: 'Default',
    isDefault: true,
    layout: { anchor: 'center', paddingX: 160, paddingY: 96, gap: 32, background: 'inherited' },
    slots: [
      { id: 's1', field: 'lyrics.pt', style: base },
      { id: 's2', field: 'lyrics.en', style: translation },
    ],
  },
  {
    id: 'song-lower-third',
    type: 'song',
    name: 'Lower third',
    isDefault: false,
    layout: { anchor: 'bottom', paddingX: 120, paddingY: 72, gap: 16, background: 'inherited' },
    slots: [
      { id: 's1', field: 'lyrics.pt', style: { ...base, size: 56, align: 'left', pill: true } },
      {
        id: 's2',
        field: 'lyrics.en',
        style: { ...translation, size: 44, align: 'left', pill: true },
      },
    ],
  },
  {
    id: 'song-retreat',
    type: 'song',
    name: 'Retreat',
    isDefault: false,
    layout: { anchor: 'top', paddingX: 160, paddingY: 120, gap: 40, background: 'dim' },
    slots: [
      {
        id: 's1',
        field: 'lyrics.pt',
        style: { ...base, fontFamily: 'Georgia', weight: 400, size: 80, color: '#fde68a' },
      },
      { id: 's2', field: 'lyrics.en', style: { ...translation, fontFamily: 'Georgia' } },
    ],
  },
  {
    id: 'bible-default',
    type: 'bible',
    name: 'Default',
    isDefault: true,
    layout: { anchor: 'center', paddingX: 200, paddingY: 96, gap: 40, background: 'dim' },
    slots: [
      {
        id: 'b1',
        field: 'bible.text',
        style: { ...base, fontFamily: 'Georgia', weight: 400, size: 64, lineHeight: 1.35 },
      },
      {
        id: 'b2',
        field: 'bible.reference',
        style: { ...base, size: 40, weight: 500, uppercase: true, color: '#a5b4fc', opacity: 90 },
      },
    ],
  },
  {
    id: 'text-default',
    type: 'text',
    name: 'Default',
    isDefault: true,
    layout: { anchor: 'center', paddingX: 160, paddingY: 96, gap: 24, background: 'black' },
    slots: [
      { id: 't1', field: 'text.title', style: { ...base, size: 88, weight: 700 } },
      { id: 't2', field: 'text.body', style: { ...base, size: 52, weight: 400, opacity: 85 } },
    ],
  },
]

/** Sample content to preview a theme with. Lyrics are invented placeholders. */
export interface Sample {
  id: string
  label: string
  slides: Partial<Record<SlotField, string>>[]
}

export const SAMPLES_BY_TYPE: Record<ThemeType, Sample[]> = {
  song: [
    {
      id: 'short',
      label: 'Short lines',
      slides: [
        {
          'lyrics.pt': 'Sobre a água calma\nTua voz me chama',
          'lyrics.en': 'Over quiet water\nYour voice is calling',
          'song.title': 'Oceans',
        },
        {
          'lyrics.pt': 'Cada passo treme\nmas eu sigo andando',
          'lyrics.en': 'Every step is trembling\nstill I keep on walking',
          'song.title': 'Oceans',
        },
      ],
    },
    {
      id: 'long',
      label: 'Long lines',
      slides: [
        {
          'lyrics.pt':
            'Mais fundo do que eu conheço, mais largo do que eu vejo\ne ainda assim Tua mão me segura firme',
          'lyrics.en':
            'Deeper than my knowing, wider than my seeing\nand still Your hand is holding me steady',
          'song.title': 'Oceans',
        },
      ],
    },
    {
      id: 'stress',
      label: 'Stress test',
      slides: [
        {
          'lyrics.pt':
            'Me leva mais longe do que meus pés iriam sozinhos\npara além das bordas da praia que eu conheço\nonde a minha coragem aprende a confiar por inteiro\ne as minhas perguntas viram louvor em silêncio',
          'lyrics.en':
            'Take me further than my feet would wander on their own\npast the edges of the shore I know\nwhere my courage learns to trust You fully\nand my questions turn to quiet praise',
          'song.title': 'Oceans',
        },
      ],
    },
  ],
  bible: [
    {
      id: 'verse',
      label: 'One verse',
      slides: [
        {
          'bible.text':
            'Porque eu bem sei os planos que tenho para vós, diz o Senhor; planos de paz e não de mal, para vos dar o fim que esperais.',
          'bible.reference': 'Jeremias 29:11',
        },
      ],
    },
    {
      id: 'long',
      label: 'Long passage',
      slides: [
        {
          'bible.text':
            'O Senhor é o meu pastor; nada me faltará. Deitar-me faz em verdes pastos, guia-me mansamente a águas tranquilas. Refrigera a minha alma; guia-me pelas veredas da justiça, por amor do seu nome.',
          'bible.reference': 'Salmos 23:1-3',
        },
      ],
    },
  ],
  text: [
    {
      id: 'notice',
      label: 'Notice',
      slides: [
        {
          'text.title': 'Offering',
          'text.body': 'PIX: ofertas@poiema.church\nThank you for giving generously',
        },
      ],
    },
  ],
}
