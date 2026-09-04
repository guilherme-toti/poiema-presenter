import { LeftPanel } from './panels/LeftPanel'
import { CenterPanel } from './panels/CenterPanel'
import { RightPanel } from './panels/RightPanel'

function App() {
  return (
    <div className="grid h-screen grid-cols-[minmax(220px,280px)_1fr_minmax(300px,380px)] bg-neutral-900 text-neutral-100 antialiased">
      <LeftPanel />
      <CenterPanel />
      <RightPanel />
    </div>
  )
}

export default App
