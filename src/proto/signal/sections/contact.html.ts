/** contact — static markup. STUB: the contact owner replaces this with the real section. */
import { SECTIONS } from '../../shared/content'
export function render(): string {
  const c = SECTIONS.contact
  return `
      <section class="chapter" id="contact" data-shape="7" aria-labelledby="contact-title">
        <div class="inner">
          <span class="kicker mono rev">${c.index} — ${c.eyebrow}</span>
          <h2 class="rev" id="contact-title">${c.title}</h2>
          <p class="rev">${c.intro}</p>
        </div>
      </section>`
}
