export type RGB = [number, number, number]

// Read an "H S% L%" CSS var → RGB 0..1. satBoost/lightTo turn the UI-tuned
// (deliberately muted, for text contrast) brand colors into luminous versions
// that actually glow over the paper instead of going muddy. Shared by the
// WebGL layers (ShaderField backdrop, ParticleHeadline swarm) so they always
// speak the same palette.
export function hslVarToRgb(
  varName: string,
  fallback: RGB,
  satBoost = 1,
  lightTo?: number,
): RGB {
  if (typeof window === 'undefined') return fallback
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim()
  // expected "H S% L%"
  const m = raw.match(/([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/)
  if (!m) return fallback
  const h = parseFloat(m[1])
  const s = Math.min(1, (parseFloat(m[2]) / 100) * satBoost)
  const l = lightTo !== undefined ? lightTo : parseFloat(m[3]) / 100
  const k = (n: number) => (n + h / 30) % 12
  const aa = s * Math.min(l, 1 - l)
  const f = (n: number) =>
    l - aa * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [f(0), f(8), f(4)]
}
