/**
 * The hero's two hand-held interactions (mouse only; the copy stays still):
 *   · hovering an impact readout pulls the core's light down its leader
 *     line to that number, with a pulse, so the figures read as powered
 *     by the machine rather than printed next to it;
 *   · the two buttons lean toward the cursor.
 * Everything else the hero does lives in the render loop (main.ts).
 */
import type { Scene } from '../scene'
import { initMatter } from './matter'

export function init(scene: Scene) {
  const hero = document.querySelector<HTMLElement>('.hero')
  if (!hero || scene.reduced) return

  // the words themselves (every pointer, touch included)
  const ink = hero.querySelector<HTMLElement>('h1 .ink')
  const sub = hero.querySelector<HTMLElement>('.sub')
  initMatter(scene, [
    ...(ink ? [{ el: ink, gradient: true }] : []),
    ...(sub ? [{ el: sub, gradient: false }] : []),
  ])
  if (scene.coarse) return

  let held: HTMLElement | null = null
  for (const card of Array.from(hero.querySelectorAll<HTMLElement>('.instr .readout'))) {
    card.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse' || !scene.live || scene.frame.morph > 0.4) return
      // the far end of the leader line (.readout::after sits 47px left of the card)
      const r = card.getBoundingClientRect()
      const p = scene.toWorld(r.left - 47, r.top + r.height / 2)
      held = card
      scene.setWell(p, 1.5)
      scene.fire(p, 0.8)
    })
    card.addEventListener('pointerleave', () => {
      if (held !== card) return
      held = null
      scene.setWell(null)
    })
  }
  // scrolling away under a still cursor fires no pointerleave: let go here
  scene.onFrame((f) => {
    if (held && f.morph > 0.4) {
      held = null
      scene.setWell(null)
    }
  })

  for (const btn of Array.from(hero.querySelectorAll<HTMLElement>('.cta'))) {
    btn.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return
      const r = btn.getBoundingClientRect()
      const dx = (e.clientX - (r.left + r.width / 2)) * 0.2
      const dy = (e.clientY - (r.top + r.height / 2)) * 0.32
      btn.style.translate = `${Math.max(-9, Math.min(9, dx)).toFixed(1)}px ${Math.max(-7, Math.min(7, dy)).toFixed(1)}px`
    })
    btn.addEventListener('pointerleave', () => (btn.style.translate = ''))
  }
}
