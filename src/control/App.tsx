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
      <div className="grid flex-1 grid-cols-[minmax(220px,280px)_1fr_minmax(300px,380px)]">
        <LeftPanel />
        <CenterPanel />
        <RightPanel />
      </div>
    </div>
  )
}

export default App
