// Biblioteca de músicas mockada para a UI. Letras inventadas (placeholders).

export interface SongSection {
  label: string
  lines: string[]
}

export interface Song {
  id: string
  title: string
  artist: string
  /** ISO date of the last service this song was used in. */
  lastUsed: string
  sections: SongSection[]
}

/** Two lyric lines per slide, rounded up per section. */
export const songSlideCount = (song: Song): number =>
  song.sections.reduce((total, section) => total + Math.ceil(section.lines.length / 2), 0)

const normalize = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export const searchSongs = (list: Song[], query: string): Song[] => {
  const q = normalize(query.trim())
  if (!q) return list
  return list.filter((song) => normalize(`${song.title} ${song.artist}`).includes(q))
}

export const recentSongs = (list: Song[], limit = 8): Song[] =>
  [...list].sort((a, b) => b.lastUsed.localeCompare(a.lastUsed)).slice(0, limit)

const section = (label: string, ...lines: string[]): SongSection => ({ label, lines })

export const songs: Song[] = [
  {
    id: 'oceans',
    title: 'Oceans',
    artist: 'Hillsong',
    lastUsed: '2026-09-07',
    sections: [
      section(
        'Verse 1',
        'Over quiet water',
        'Your voice is calling',
        'Every step is trembling',
        'still I keep on walking',
        'Deeper than my knowing',
        'wider than my seeing',
      ),
      section(
        'Chorus',
        'I will hold on',
        'when the waves are rising',
        'You are the anchor',
        'that will not be moving',
        'Through every storm',
        'my heart is resting',
      ),
      section(
        'Verse 2',
        'Morning finds me steady',
        'evening finds me singing',
        'Nothing that I carry',
        'is heavier than Your hand',
        'All that I was holding',
        'I am letting go now',
      ),
      section(
        'Bridge',
        'Take me further',
        'than my feet would wander',
        'Past the edges',
        'of the shore I know',
        'Where my courage',
        'learns to trust You fully',
        'Where my questions',
        'turn to quiet praise',
        'Take me further',
        'take me further',
      ),
    ],
  },
  {
    id: 'e-ele',
    title: 'É Ele',
    artist: 'Poiema Worship',
    lastUsed: '2026-09-07',
    sections: [
      section(
        'Verso 1',
        'Quando a noite chega',
        'e o medo quer falar',
        'Uma voz me lembra',
        'quem me fez andar',
        'Não é minha força',
        'nem o meu saber',
      ),
      section(
        'Refrão',
        'É Ele quem sustenta',
        'é Ele quem conduz',
        'É Ele quem acende',
        'no escuro uma luz',
        'É Ele, é Ele',
        'o meu lugar de paz',
      ),
      section(
        'Ponte',
        'Nada vai mudar',
        'o que Ele já fez',
        'Nada vai calar',
        'o que Ele já disse',
        'Eu vou descansar',
        'eu vou descansar',
        'no que Ele é',
        'no que Ele é',
        'no que Ele é',
        'no que Ele é',
      ),
    ],
  },
  {
    id: 'free',
    title: 'Free!',
    artist: 'Poiema Worship',
    lastUsed: '2026-09-07',
    sections: [
      section(
        'Verse 1',
        'I used to count the walls',
        'and measure every door',
        'Now the doors are open',
        'and I am not afraid',
      ),
      section(
        'Chorus',
        'Free, I am free',
        'the chains are on the floor',
        'Free, I am free',
        'and I will dance once more',
        'Free, I am free',
        'the chains are on the floor',
      ),
      section(
        'Verse 2',
        'Every heavy morning',
        'every sleepless night',
        'You were there beside me',
        'turning on the light',
      ),
      section(
        'Tag',
        'And I will dance once more',
        'and I will dance once more',
        'once more',
        'once more',
      ),
    ],
  },
  {
    id: 'morning-light',
    title: 'Morning Light',
    artist: 'River Collective',
    lastUsed: '2026-08-31',
    sections: [
      section(
        'Verse 1',
        'Before the day has spoken',
        'before the birds have flown',
        'You are already singing',
        'over all I have not known',
      ),
      section(
        'Chorus',
        'Morning light, morning light',
        'breaking over everything',
        'Morning light, morning light',
        'You are here and I can sing',
      ),
      section(
        'Bridge',
        'Nothing hidden, nothing lost',
        'every shadow has a name',
        'You have called it and it goes',
        'and the sky is not the same',
      ),
    ],
  },
  {
    id: 'steady-hands',
    title: 'Steady Hands',
    artist: 'River Collective',
    lastUsed: '2026-08-31',
    sections: [
      section(
        'Verse 1',
        'I have watched the seasons turning',
        'watched my plans dissolve like sand',
        'Still the one thing I am sure of',
        'is the steadiness of Your hand',
      ),
      section(
        'Chorus',
        'Steady hands, steady hands',
        'when I do not understand',
        'Steady hands, steady hands',
        'holding all I cannot hold',
      ),
      section(
        'Verse 2',
        'When the road is only questions',
        'when the map has lost its lines',
        'You are patient in my slowness',
        'You are faithful all the time',
      ),
    ],
  },
  {
    id: 'casa-de-paz',
    title: 'Casa de Paz',
    artist: 'Poiema Worship',
    lastUsed: '2026-08-24',
    sections: [
      section(
        'Verso 1',
        'Abro as portas da minha casa',
        'pra Tua paz entrar',
        'Cada canto, cada sala',
        'Tua presença a morar',
      ),
      section(
        'Refrão',
        'Casa de paz, casa de luz',
        'onde o Teu nome é cantado',
        'Casa de paz, casa de luz',
        'onde o cansado é abraçado',
      ),
    ],
  },
  {
    id: 'vento-novo',
    title: 'Vento Novo',
    artist: 'Poiema Worship',
    lastUsed: '2026-08-24',
    sections: [
      section(
        'Verso 1',
        'Sopra sobre o que secou',
        'sopra sobre o que parou',
        'Traz de volta a cor',
        'do que o tempo apagou',
      ),
      section(
        'Refrão',
        'Vento novo, vem soprar',
        'vento novo, vem soprar',
        'Sobre a terra, sobre o mar',
        'sobre o meu coração',
      ),
      section(
        'Ponte',
        'Não há vale tão profundo',
        'nem um muro tão alto',
        'que o Teu vento não alcance',
        'que o Teu vento não derrube',
      ),
    ],
  },
  {
    id: 'open-skies',
    title: 'Open Skies',
    artist: 'Harbor Music',
    lastUsed: '2026-08-17',
    sections: [
      section(
        'Verse 1',
        'I traded all my ceilings',
        'for a roof I cannot see',
        'And every ordinary morning',
        'became a place to breathe',
      ),
      section(
        'Chorus',
        'Open skies above me',
        'open hands beneath',
        'You are always wider',
        'than the room I keep',
      ),
    ],
  },
  {
    id: 'every-season',
    title: 'Every Season',
    artist: 'Harbor Music',
    lastUsed: '2026-08-10',
    sections: [
      section(
        'Verse 1',
        'Spring came in with promises',
        'summer kept a few',
        'Autumn took the easy ones',
        'winter left me You',
      ),
      section(
        'Chorus',
        'Every season, every year',
        'You are the constant here',
        'Every season, every year',
        'You are the constant here',
      ),
    ],
  },
  {
    id: 'table-set',
    title: 'Table Set',
    artist: 'Harbor Music',
    lastUsed: '2026-07-27',
    sections: [
      section(
        'Verse 1',
        'There is a table set for me',
        'in a room I did not build',
        'There is a chair that has my name',
        'and a cup that will be filled',
      ),
      section(
        'Chorus',
        'Come and sit, come and rest',
        'you are welcome, you are guest',
        'Come and sit, come and stay',
        'no one here is turned away',
      ),
    ],
  },
]
