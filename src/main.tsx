import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Prevent vertical scrolling on mobile browsers (especially iOS Safari)
if (typeof window !== 'undefined') {
  document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1 || (e as any).scale !== 1) return; // Allow pinch zoom if enabled
    e.preventDefault();
  }, { passive: false });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
