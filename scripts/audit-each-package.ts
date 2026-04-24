#!/usr/bin/env bun
/**
 * Independent per-package vulnerability cross-check via OSV.dev.
 *
 * Why this exists alongside `bun audit`:
 *   - Separate data source (OSV aggregates GitHub + NVD + PyPA + others;
 *     bun uses the npm advisory DB derived from GHSA).
 *   - Validates EVERY installed version, not only the roots.
 *   - Produces a per-package status line — useful when a human wants to
 *     verify one-by-one rather than trust a summary.
 *
 * Output:
 *   - Pretty per-package status, grouped by [DIRECT] / [TRANSITIVE].
 *   - Non-zero exit code if any vulnerability is discovered.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

type Query = { package: { name: string; ecosystem: 'npm' }; version: string }
type Vuln = { id: string; summary?: string; severity?: Array<{ type: string; score: string }> }
type BatchResult = { results: Array<{ vulns?: Array<{ id: string }> }> }

const ROOT = resolve(import.meta.dir, '..')
const pkgJson = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'))
const directNames = new Set<string>([
  ...Object.keys(pkgJson.dependencies ?? {}),
  ...Object.keys(pkgJson.devDependencies ?? {}),
])

// Parse bun.lock (JSONC-ish). Bun lockfile is JSON with trailing commas allowed.
const lockRaw = readFileSync(resolve(ROOT, 'bun.lock'), 'utf8')
// Strip trailing commas before } or ] so JSON.parse accepts it.
const lockJson = JSON.parse(lockRaw.replace(/,(\s*[}\]])/g, '$1'))

// bun.lock schema: { packages: { "<name>": [ "<name>@<version>", ...deps, ..., { ... }, "<integrity>" ] } }
const installed: Array<{ name: string; version: string }> = []
const seen = new Set<string>()
for (const [key, arr] of Object.entries<any>(lockJson.packages ?? {})) {
  if (!Array.isArray(arr) || arr.length === 0) continue
  const spec = arr[0]
  if (typeof spec !== 'string') continue
  // Format: "@scope/name@1.2.3" or "name@1.2.3" (may also be "name@npm:other@1.2.3")
  const at = spec.lastIndexOf('@')
  if (at <= 0) continue
  const name = spec.slice(0, at)
  const version = spec.slice(at + 1)
  // Skip non-semver (e.g., "workspace:*" or git/url specs that don't resolve to npm ecosystem).
  if (!/^\d+\.\d+\.\d+/.test(version)) continue
  const id = `${name}@${version}`
  if (seen.has(id)) continue
  seen.add(id)
  installed.push({ name, version })
}

installed.sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version))
console.log(`\n🔍 OSV.dev cross-check — ${installed.length} installed (name, version) pairs\n`)

// OSV batch endpoint has a hard limit of 1000 queries per request.
const BATCH = 500
const allResults: Array<{ vulns?: Array<{ id: string }> }> = []
for (let i = 0; i < installed.length; i += BATCH) {
  const chunk = installed.slice(i, i + BATCH)
  const queries: Query[] = chunk.map(p => ({
    package: { name: p.name, ecosystem: 'npm' },
    version: p.version,
  }))
  const res = await fetch('https://api.osv.dev/v1/querybatch', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ queries }),
  })
  if (!res.ok) {
    console.error(`OSV request failed: ${res.status} ${res.statusText}`)
    process.exit(2)
  }
  const batch = (await res.json()) as BatchResult
  allResults.push(...batch.results)
}

// Resolve vuln details for any hits (OSV's /v1/vulns/{id} gives summary + severity).
const vulnIds = new Set<string>()
for (const r of allResults) for (const v of r.vulns ?? []) vulnIds.add(v.id)

const vulnDetails = new Map<string, Vuln>()
await Promise.all(
  Array.from(vulnIds).map(async id => {
    const res = await fetch(`https://api.osv.dev/v1/vulns/${id}`)
    if (res.ok) vulnDetails.set(id, (await res.json()) as Vuln)
  }),
)

let vulnCount = 0
const direct = installed.filter(p => directNames.has(p.name))
const transitive = installed.filter(p => !directNames.has(p.name))

const printGroup = (label: string, list: typeof installed) => {
  console.log(`\n━━━ ${label} (${list.length}) ━━━`)
  for (const p of list) {
    const idx = installed.indexOf(p)
    const r = allResults[idx]
    const vs = r?.vulns ?? []
    if (vs.length === 0) {
      console.log(`  ✔ ${p.name}@${p.version}`)
    } else {
      vulnCount += vs.length
      console.log(`  ✘ ${p.name}@${p.version}`)
      for (const v of vs) {
        const d = vulnDetails.get(v.id)
        const sev = d?.severity?.[0]?.score ?? ''
        const sum = d?.summary ?? ''
        console.log(`      ${v.id}  ${sev}  ${sum}`)
      }
    }
  }
}

printGroup('DIRECT DEPS', direct)
printGroup('TRANSITIVE DEPS', transitive)

console.log(`\n${vulnCount === 0 ? '✅' : '❌'} total vulnerabilities: ${vulnCount}\n`)
process.exit(vulnCount === 0 ? 0 : 1)
