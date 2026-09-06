/** about pages. STUB: the about page owner replaces this file with the real pages (index and details as applies). */
import type { PageSpec } from '../layout'
export function aboutPages(): PageSpec[] {
  return [
    {
      path: '/about/',
      title: 'About',
      description: 'About — Felix Noriel',
      shape: 0,
      css: [],
      main: `
      <section class="chapter" id="about" aria-labelledby="about-title">
        <div class="inner">
          <span class="kicker mono rev">about</span>
          <h1 class="rev" id="about-title">About</h1>
          <p class="rev">This page is being built.</p>
        </div>
      </section>`,
    },
  ]
}
