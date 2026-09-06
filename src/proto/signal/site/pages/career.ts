/** career pages. STUB: the career page owner replaces this file with the real pages (index and details as applies). */
import type { PageSpec } from '../layout'
export function careerPages(): PageSpec[] {
  return [
    {
      path: '/career/',
      title: 'Experience',
      description: 'Experience — Felix Noriel',
      shape: 2,
      css: [],
      main: `
      <section class="chapter" id="career" aria-labelledby="career-title">
        <div class="inner">
          <span class="kicker mono rev">career</span>
          <h1 class="rev" id="career-title">Experience</h1>
          <p class="rev">This page is being built.</p>
        </div>
      </section>`,
    },
  ]
}
