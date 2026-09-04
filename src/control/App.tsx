import { TitleBar } from './chrome/TitleBar'
import { StatusBar } from './chrome/StatusBar'
import { NavRail } from './panels/NavRail'
import { LeftPanel } from './panels/LeftPanel'
import { CenterPanel } from './panels/CenterPanel'
import { RightPanel } from './panels/RightPanel'
import { UpdateBanner } from './components/UpdateBanner'
import { useUpdater } from './hooks/useUpdater'

function App() {
  const updater = useUpdater()

  return (
    <div className="flex h-screen flex-col bg-neutral-900 text-neutral-100 antialiased">
      <UpdateBanner updater={updater} />
      <TitleBar />
      <StatusBar />
      <div className="grid flex-1 grid-cols-[56px_minmax(240px,280px)_1fr_minmax(320px,380px)] overflow-hidden">
        <NavRail />
        <LeftPanel />
        <CenterPanel />
        <RightPanel />
      </div>
    </div>
  )
}

export default App
