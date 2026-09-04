import { useState } from 'react'
import { TitleBar } from './chrome/TitleBar'
import { StatusBar } from './chrome/StatusBar'
import { NavRail, type Library } from './panels/NavRail'
import { LeftPanel } from './panels/LeftPanel'
import { CenterPanel } from './panels/CenterPanel'
import { RightPanel } from './panels/RightPanel'
import { UpdateBanner } from './components/UpdateBanner'
import { ServicesDialog } from './components/ServicesDialog'
import { SongsDialog } from './components/SongsDialog'
import { MediaDialog } from './components/MediaDialog'
import { ThemesDialog } from './components/ThemesDialog'
import { useUpdater } from './hooks/useUpdater'
import type { DragPayload } from './lib/dnd'
import {
  addMediaToTimeline,
  addSongToTimeline,
  insertAt,
  mediaItem,
  moveEntry,
  songItem,
} from './lib/timeline'
import { recentServices, timelineEntries, type Service, type TimelineEntry } from './mockData'
import { songs, type Song } from './mockSongs'
import { media, type MediaAsset } from './mockMedia'

/** Libraries that already have a dialog. The rest are placeholders for now. */
const DIALOG_LIBRARIES: ReadonlySet<Library> = new Set<Library>([
  'service',
  'songs',
  'media',
  'themes',
])
const WINDOW_BASE_Z = 40

function App() {
  const updater = useUpdater()

  const [currentService, setCurrentService] = useState<Service>(recentServices[0])
  const [timeline, setTimeline] = useState<TimelineEntry[]>(timelineEntries)
  const [selectedItemId, setSelectedItemId] = useState<string | null>('oceans-1')
  /** Open library windows, back to front. */
  const [openLibraries, setOpenLibraries] = useState<Library[]>([])

  const focusLibrary = (library: Library) =>
    setOpenLibraries((open) => [...open.filter((l) => l !== library), library])

  const closeLibrary = (library: Library) =>
    setOpenLibraries((open) => open.filter((l) => l !== library))

  const toggleLibrary = (library: Library) => {
    if (!DIALOG_LIBRARIES.has(library)) return
    if (openLibraries.includes(library)) closeLibrary(library)
    else focusLibrary(library)
  }

  const openService = (service: Service) => {
    setCurrentService(service)
    closeLibrary('service')
  }

  const addSong = (song: Song) => setTimeline((entries) => addSongToTimeline(entries, song))
  const addMedia = (asset: MediaAsset) =>
    setTimeline((entries) => addMediaToTimeline(entries, asset))

  const dropOnTimeline = (payload: DragPayload, index: number) => {
    setTimeline((entries) => {
      switch (payload.source) {
        case 'timeline':
          return moveEntry(entries, payload.id, index)
        case 'song': {
          const song = songs.find((s) => s.id === payload.id)
          return song ? insertAt(entries, index, songItem(entries, song)) : entries
        }
        case 'media': {
          const asset = media.find((m) => m.id === payload.id)
          return asset ? insertAt(entries, index, mediaItem(entries, asset)) : entries
        }
      }
    })
  }

  const windowProps = (library: Library) => ({
    zIndex: WINDOW_BASE_Z + openLibraries.indexOf(library),
    focused: openLibraries[openLibraries.length - 1] === library,
    onFocus: () => focusLibrary(library),
    onClose: () => closeLibrary(library),
  })

  return (
    <div className="flex h-screen flex-col bg-neutral-900 text-neutral-100 antialiased">
      <UpdateBanner updater={updater} />
      <TitleBar />
      <StatusBar />
      <div className="grid flex-1 grid-cols-[56px_minmax(240px,280px)_1fr_minmax(320px,380px)] overflow-hidden">
        <NavRail active={openLibraries} onOpen={toggleLibrary} />
        <LeftPanel
          currentService={currentService}
          onSelectService={setCurrentService}
          onOpenServices={() => focusLibrary('service')}
          timeline={timeline}
          selectedItemId={selectedItemId}
          onSelectItem={setSelectedItemId}
          onDrop={dropOnTimeline}
        />
        <CenterPanel />
        <RightPanel />
      </div>

      {openLibraries.map((library) => {
        switch (library) {
          case 'service':
            return (
              <ServicesDialog
                key={library}
                services={recentServices}
                currentId={currentService.id}
                onOpen={openService}
                {...windowProps(library)}
              />
            )
          case 'songs':
            return (
              <SongsDialog
                key={library}
                songs={songs}
                timeline={timeline}
                onAdd={addSong}
                {...windowProps(library)}
              />
            )
          case 'media':
            return (
              <MediaDialog
                key={library}
                media={media}
                timeline={timeline}
                onAdd={addMedia}
                {...windowProps(library)}
              />
            )
          case 'themes':
            return <ThemesDialog key={library} {...windowProps(library)} />
          default:
            return null
        }
      })}
    </div>
  )
}

export default App
