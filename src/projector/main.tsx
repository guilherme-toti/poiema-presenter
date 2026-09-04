import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ProjectorRoot } from './ProjectorRoot'
import '../control/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProjectorRoot />
  </StrictMode>,
)
