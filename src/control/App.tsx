import { useCallback, useState } from 'react'
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
import { useUpdater } from './hooks/useUpdater'
import { addMediaToTimeline, addSongToTimeline } from './lib/timeline'
import { recentServices, timelineEntries, type Service, type TimelineEntry } from './mockData'
import { songs, type Song } from './mockSongs'
import { media, type MediaAsset } from './mockMedia'

/** Libraries that already have a dialog. The rest are placeholders for now. */
const DIALOG_LIBRARIES: ReadonlySet<Library> = new Set<Library>(['service', 'songs', 'media'])

function App() {
  const updater = useUpdater()

  const [currentService, setCurrentService] = useState<Service>(recentServices[0])
  const [timeline, setTimeline] = useState<TimelineEntry[]>(timelineEntries)
  const [selectedItemId, setSelectedItemId] = useState<string | null>('oceans-1')
  const [openLibrary, setOpenLibrary] = useState<Library | null>(null)

  const closeDialog = useCallback(() => setOpenLibrary(null), [])

  const openLibraryDialog = (library: Library) => {
    if (!DIALOG_LIBRARIES.has(library)) return
    setOpenLibrary((current) => (current === library ? null : library))
  }

  const openService = (service: Service) => {
    setCurrentService(service)
    setOpenLibrary(null)
  }

  const addSong = (song: Song) => {
    setTimeline((entries) => addSongToTimeline(entries, song))
  }

  const addMedia = (asset: MediaAsset) => {
    setTimeline((entries) => addMediaToTimeline(entries, asset))
  }

  return (
    <div className="flex h-screen flex-col bg-neutral-900 text-neutral-100 antialiased">
      <UpdateBanner updater={updater} />
      <TitleBar />
      <StatusBar />
      <div className="grid flex-1 grid-cols-[56px_minmax(240px,280px)_1fr_minmax(320px,380px)] overflow-hidden">
        <NavRail active={openLibrary} onOpen={openLibraryDialog} />
        <LeftPanel
          currentService={currentService}
          onSelectService={setCurrentService}
          onOpenServices={() => setOpenLibrary('service')}
          timeline={timeline}
          selectedItemId={selectedItemId}
          onSelectItem={setSelectedItemId}
        />
        <CenterPanel />
        <RightPanel />
      </div>

      {openLibrary === 'service' && (
        <ServicesDialog
          services={recentServices}
          currentId={currentService.id}
          onOpen={openService}
          onClose={closeDialog}
        />
      )}
      {openLibrary === 'songs' && (
        <SongsDialog songs={songs} timeline={timeline} onAdd={addSong} onClose={closeDialog} />
      )}
      {openLibrary === 'media' && (
        <MediaDialog media={media} timeline={timeline} onAdd={addMedia} onClose={closeDialog} />
      )}
    </div>
  )
}

export default App
