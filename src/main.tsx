import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'

import { Explorer } from './pages/explorer'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Explorer />
  </StrictMode>,
)
