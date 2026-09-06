/** skills — static markup. STUB: the skills owner replaces this with the real section. */
import { SECTIONS } from '../../shared/content'
export function render(): string {
  const c = SECTIONS.skills
  return `
      <section class="chapter" id="skills" data-shape="4" aria-labelledby="skills-title">
        <div class="inner">
          <span class="kicker mono rev">${c.index} — ${c.eyebrow}</span>
          <h2 class="rev" id="skills-title">${c.title}</h2>
          <p class="rev">${c.intro}</p>
        </div>
      </section>`
}
