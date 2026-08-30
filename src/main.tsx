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

// A hidden tab never fires rAF, and has nothing to paint anyway — mount now.
if (document.visibilityState === 'hidden') {
  mount()
} else {
  requestAnimationFrame(() => requestAnimationFrame(mount))
  // Safety net only, for frames that stop coming (the tab is hidden between
  // now and the second frame). It must never win the race against a real
  // frame, which arrives in ~16ms: an earlier version used 120ms here and
  // the timeout beat the frame on exactly the slow cold loads this is meant
  // to fix, putting first paint back at ~2.4s on a third of live runs.
  setTimeout(mount, 2000)
}
