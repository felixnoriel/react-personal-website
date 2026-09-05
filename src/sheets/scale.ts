/**
 * The Scale - the site's one interactive drawing device.
 *
 * Nine careers are already drawn to one true axis. This makes that axis
 * draggable: grab it and a red hairline follows the pointer along the
 * 2013 -> now span, the month under it prints at the axis's left end with the
 * real number of roles live in it, and every row whose tenure covers that
 * month keeps its ink while the rest recede.
 *
 * Everything visible is a colour change, so nothing here can move the page:
 * the handler writes one custom property, toggles nine attributes and sets one
 * string. It is attached on idle and does nothing at all until a pointer or a
 * key reaches the input.
 *
 * The input is a native <input type="range">, so keyboard, touch, the 44px
 * target and the screen-reader announcement all come from the platform.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * A decimal year -> "Apr 2022".
 *
 * Deliberately not Intl.DateTimeFormat over a live clock: this string is
 * derived only from the slider's own value, so it can never differ between
 * the build-time render and the browser.
 */
export function formatMonth(t: number): string {
  const year = Math.floor(t)
  // +1e-6 absorbs the float error in a 1/12 step so Jan never reads as Dec
  const month = Math.min(11, Math.max(0, Math.floor((t - year) * 12 + 1e-6)))
  return `${MONTHS[month]} ${year}`
}

/**
 * Wire the scrubber inside `root` (the experience sheet, or the /career page).
 * Returns a teardown for the effect that attached it.
 */
export function initScale(root: HTMLElement): () => void {
  const scale = root.querySelector<HTMLElement>('.scale')
  const input = root.querySelector<HTMLInputElement>('.scale__input')
  const readout = root.querySelector<HTMLElement>('.scale__readout')
  if (!scale || !input || !readout) return () => {}

  const rows = Array.from(root.querySelectorAll<HTMLElement>('.career-row'))
  const min = Number(input.min)
  const max = Number(input.max)
  const span = max - min || 1

  const apply = () => {
    const t = Number(input.value)
    scale.style.setProperty('--t', String((t - min) / span))
    let live = 0
    for (const row of rows) {
      const on = t >= Number(row.dataset.start) && t <= Number(row.dataset.end)
      row.toggleAttribute('data-live', on)
      if (on) live += 1
    }
    readout.textContent = `${formatMonth(t)} · ${live} ${live === 1 ? 'role' : 'roles'}`
    scale.toggleAttribute('data-scrubbing', true)
  }

  const rest = () => {
    scale.removeAttribute('data-scrubbing')
    for (const row of rows) row.removeAttribute('data-live')
    readout.textContent = ''
  }

  input.addEventListener('input', apply)
  input.addEventListener('pointerup', rest)
  input.addEventListener('blur', rest)
  scale.addEventListener('pointerleave', rest)

  return () => {
    input.removeEventListener('input', apply)
    input.removeEventListener('pointerup', rest)
    input.removeEventListener('blur', rest)
    scale.removeEventListener('pointerleave', rest)
    rest()
  }
}
