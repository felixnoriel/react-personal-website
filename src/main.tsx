import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Let the browser paint the static boot frame BEFORE React mounts.
//
// The module script runs the moment parsing ends, and React's first render
// (the whole landing page) is one long synchronous task. Chrome does not
// squeeze a frame in ahead of it, so the boot frame that index.html paints
// "instantly" was in fact waiting the entire mount out: measured on the live
// site, the DOM was ready at 111ms and nothing appeared until 1268ms — on an
// unthrottled laptop. A phone pays several times that in blank screen.
//
// We wait for the actual paint event rather than counting animation frames.
// Counting frames assumes a frame implies a paint, and it does not: when the
// render-blocking stylesheet is still in flight, frames pass with nothing
// drawn, the mount starts anyway, and first paint lands a second later.
// Measured live: paint 30ms after the stylesheet when this works, and about
// 1000ms after it when the mount wins instead.
let mounted = false
const mount = () => {
  if (mounted) return
  mounted = true
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

try {
  // buffered:true means a paint that already happened still fires this, so
  // there is no window where we miss the event and wait for the timeout.
  const observer = new PerformanceObserver(() => {
    observer.disconnect()
    mount()
  })
  observer.observe({ type: 'paint', buffered: true })
} catch {
  mount() // no PerformanceObserver: mount rather than never render
}

// Backstop for the case where no paint is coming: a hidden tab, which has
// nothing to draw. Deliberately far longer than any real first paint, so it
// never robs a visible page of the early frame this exists to protect.
setTimeout(mount, 2000)
