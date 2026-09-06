/** experience — static markup. STUB: the experience owner replaces this with the real section. */
import { SECTIONS } from '../../shared/content'
export function render(): string {
  const c = SECTIONS.experience
  return `
      <section class="chapter" id="experience" data-shape="2" aria-labelledby="experience-title">
        <div class="inner">
          <span class="kicker mono rev">${c.index} — ${c.eyebrow}</span>
          <h2 class="rev" id="experience-title">${c.title}</h2>
          <p class="rev">${c.intro}</p>
        </div>
      </section>`
}
