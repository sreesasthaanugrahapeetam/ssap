import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './pwaInstall'
import App from './App'
import './styles/index.css'

try {
  const r = sessionStorage.getItem('spa-redirect')
  if (r) { sessionStorage.removeItem('spa-redirect'); history.replaceState(null, '', r) }
} catch {}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
