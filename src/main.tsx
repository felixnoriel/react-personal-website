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
// Two rAFs: the first fires before the pending frame is drawn, the second
// after it — so by the time we mount, the visitor is looking at the boot
// screen. Costs one frame; buys back every millisecond of that blank window.
// The timeout is not belt-and-braces: rAF does not fire at all in a
// background tab, so without it a site opened in a background tab would
// never mount.
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
requestAnimationFrame(() => requestAnimationFrame(mount))
setTimeout(mount, 120)
