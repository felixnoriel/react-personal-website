/** projects pages. STUB: the projects page owner replaces this file with the real pages (index and details as applies). */
import type { PageSpec } from '../layout'
export function projectPages(): PageSpec[] {
  return [
    {
      path: '/projects/',
      title: 'Projects',
      description: 'Projects — Felix Noriel',
      shape: 3,
      css: [],
      main: `
      <section class="chapter" id="projects" aria-labelledby="projects-title">
        <div class="inner">
          <span class="kicker mono rev">projects</span>
          <h1 class="rev" id="projects-title">Projects</h1>
          <p class="rev">This page is being built.</p>
        </div>
      </section>`,
    },
  ]
}
