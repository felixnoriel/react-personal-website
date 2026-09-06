/** writing — static markup. STUB: the writing owner replaces this with the real section. */
import { SECTIONS } from '../../shared/content'
export function render(): string {
  const c = SECTIONS.writing
  return `
      <section class="chapter" id="writing" data-shape="6" aria-labelledby="writing-title">
        <div class="inner">
          <span class="kicker mono rev">${c.index} — ${c.eyebrow}</span>
          <h2 class="rev" id="writing-title">${c.title}</h2>
          <p class="rev">${c.intro}</p>
        </div>
      </section>`
}
