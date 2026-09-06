/** notfound pages. STUB: the notfound page owner replaces this file with the real pages (index and details as applies). */
import type { PageSpec } from '../layout'
export function notFoundPages(): PageSpec[] {
  return [
    {
      path: '/404/',
      title: 'Not found',
      description: 'Not found — Felix Noriel',
      shape: 7,
      css: [],
      main: `
      <section class="chapter" id="notfound" aria-labelledby="notfound-title">
        <div class="inner">
          <span class="kicker mono rev">notfound</span>
          <h1 class="rev" id="notfound-title">Not found</h1>
          <p class="rev">This page is being built.</p>
        </div>
      </section>`,
    },
  ]
}
