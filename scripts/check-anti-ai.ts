/**
 * The anti-AI checklist as a test, not a promise.
 *
 * Reads the COMPILED stylesheets in dist/assets and fails on any of the
 * documented tells: gradients, backdrop filters, box shadows, rounded
 * corners over 4px (or any % radius), killed focus outlines, and a
 * monospace font-family (this design has no mono face). Written against
 * minified output, so patterns tolerate missing spaces.
 *
 *   bun scripts/check-anti-ai.ts            # blocking
 *   bun scripts/check-anti-ai.ts --warn     # report only
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const DIR = 'dist/assets'
const warnOnly = process.argv.includes('--warn')

if (!existsSync(DIR)) {
  console.error(`check-anti-ai: ${DIR} not found - run the build first`)
  process.exit(warnOnly ? 0 : 1)
}

// @property blocks may legitimately declare initial-value: none; strip them.
const strip = (css: string) => css.replace(/@property[^{]*\{[^}]*\}/g, '')

const BANS: Array<[string, RegExp]> = [
  ['gradient', /-gradient\s*\(/g],
  ['backdrop-filter', /(?:^|[;{\s])-?(?:webkit-)?backdrop-filter\s*:/g],
  ['box-shadow', /box-shadow\s*:\s*(?!none|unset|inherit|initial)/g],
  ['killed outline', /(?:^|[;{])\s*outline(?:-style)?\s*:\s*none/g],
  ['monospace font', /font-family\s*:[^;}]*monospace/g],
]

// This design is square. Anything over 4px, and any % radius, fails.
const RADIUS = /border(?:-[a-z]+)*-radius\s*:\s*([^;}]+)/g
const badRadius = (v: string) => /%/.test(v) || (v.match(/([\d.]+)px/g) ?? []).some((n) => parseFloat(n) > 4)

const failures: string[] = []
for (const f of readdirSync(DIR).filter((f) => f.endsWith('.css'))) {
  const css = strip(readFileSync(join(DIR, f), 'utf8'))
  for (const [name, re] of BANS) {
    const n = (css.match(re) ?? []).length
    if (n) failures.push(`${f}: ${n}x ${name}`)
  }
  for (const m of css.matchAll(RADIUS)) {
    if (badRadius(m[1])) failures.push(`${f}: border-radius ${m[1].trim()}`)
  }
}

if (failures.length) {
  console[warnOnly ? 'warn' : 'error'](`check-anti-ai: ${failures.length} finding(s)\n` + failures.join('\n'))
  process.exit(warnOnly ? 0 : 1)
}
console.log('check-anti-ai: clean')
