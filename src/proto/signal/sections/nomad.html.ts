/** nomad — static markup. STUB: the nomad owner replaces this with the real section. */
import { SECTIONS } from '../../shared/content'
export function render(): string {
  const c = SECTIONS.nomad
  return `
      <section class="chapter" id="nomad" data-shape="5" aria-labelledby="nomad-title">
        <div class="inner">
          <span class="kicker mono rev">${c.index} — ${c.eyebrow}</span>
          <h2 class="rev" id="nomad-title">${c.title}</h2>
          <p class="rev">${c.intro}</p>
        </div>
      </section>`
}
