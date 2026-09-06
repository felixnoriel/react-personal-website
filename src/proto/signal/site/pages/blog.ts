/** blog pages. STUB: the blog page owner replaces this file with the real pages (index and details as applies). */
import type { PageSpec } from '../layout'
export function blogPages(): PageSpec[] {
  return [
    {
      path: '/blog/',
      title: 'Writing',
      description: 'Writing — Felix Noriel',
      shape: 6,
      css: [],
      main: `
      <section class="chapter" id="blog" aria-labelledby="blog-title">
        <div class="inner">
          <span class="kicker mono rev">blog</span>
          <h1 class="rev" id="blog-title">Writing</h1>
          <p class="rev">This page is being built.</p>
        </div>
      </section>`,
    },
  ]
}
