import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Coffee, MapPin, Plane, Utensils } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AnimatedNumber } from './ui/AnimatedNumber'
import {
  FxWord,
  GlassPanel,
  HudDot,
  Reveal,
  SectionHeading,
  SectionShell,
} from './ui/section'
import { ACCENT, type Accent } from './ui/section-tokens'
import { useFxLevel } from '../hooks/useFxLevel'

// ============================================================
// NomadLife — "Nomading across Asia with the fam and a laptop."
//
// Rebuilt from a ~2,165-line flight-radar (600+ SVG nodes, SMIL
// clouds/stars/shooting-stars/radar-sweep/ambient-planes, 3D tilt,
// boarding passes, departures board, live ticker) into a calm world
// map + clean stats + a travel-imagery strip. Same real travel data,
// far easier to take in, a handful of animations instead of dozens.
// ============================================================

type City = {
  code: string
  name: string
  lng: number
  lat: number
  current?: boolean
  labelDx?: number
  labelDy?: number
  labelAnchor?: 'start' | 'end' | 'middle'
}

const CITIES: City[] = [
  { code: 'MNL', name: 'Manila', lng: 120.98, lat: 14.6 },
  { code: 'BKK', name: 'Bangkok', lng: 100.5, lat: 13.75, current: true, labelDx: -2, labelAnchor: 'end' },
  { code: 'HKG', name: 'Hong Kong', lng: 114.17, lat: 22.32, labelDx: -2, labelAnchor: 'end' },
  { code: 'TPE', name: 'Taipei', lng: 121.5, lat: 25.05 },
  { code: 'SEL', name: 'Seoul', lng: 126.98, lat: 37.57 },
  { code: 'TYO', name: 'Tokyo', lng: 139.77, lat: 35.68 },
  { code: 'SIN', name: 'Singapore', lng: 103.82, lat: 1.35, labelDy: 2.8 },
  { code: 'BLI', name: 'Bali', lng: 115.21, lat: -8.5, labelDy: 2.8 },
  { code: 'SYD', name: 'Sydney', lng: 151.21, lat: -33.87 },
  { code: 'NYC', name: 'New York', lng: -74, lat: 40.71 },
  { code: 'LAX', name: 'Los Angeles', lng: -118.24, lat: 34.05 },
  { code: 'YYZ', name: 'Toronto', lng: -79.38, lat: 43.65, labelDx: -2, labelAnchor: 'end' },
  { code: 'MAD', name: 'Madrid', lng: -3.7, lat: 40.42, labelDx: -2, labelAnchor: 'end' },
  { code: 'BLQ', name: 'Bologna', lng: 11.34, lat: 44.49, labelDy: 2.8 },
  { code: 'MUC', name: 'Munich', lng: 11.58, lat: 48.14 },
]

const idx = (code: string): number => CITIES.findIndex((c) => c.code === code)

const ROUTE_EDGES: Array<[string, string]> = [
  ['MNL', 'TPE'],
  ['TPE', 'TYO'],
  ['TYO', 'SEL'],
  ['SEL', 'HKG'],
  ['HKG', 'MNL'],
  ['MNL', 'BKK'],
  ['BKK', 'SIN'],
  ['SIN', 'BLI'],
  ['BLI', 'SYD'],
  ['MNL', 'MAD'],
  ['MAD', 'BLQ'],
  ['BLQ', 'MUC'],
  ['MAD', 'NYC'],
  ['NYC', 'YYZ'],
  ['NYC', 'LAX'],
]

// Highlighted "active" tour from the current base, westward
const ACTIVE_EDGES: Array<[string, string]> = [
  ['BKK', 'MAD'],
  ['MAD', 'NYC'],
  ['NYC', 'LAX'],
]

// Stylized dotted continents (lng, lat)
const LAND_DOTS: Array<[number, number]> = [
  [-155, 66], [-145, 65], [-135, 62], [-125, 60], [-115, 60], [-105, 62],
  [-95, 62], [-85, 65], [-75, 68], [-65, 60], [-55, 55], [-45, 72], [-38, 65],
  [-50, 76], [-25, 72],
  [-125, 48], [-118, 45], [-112, 45], [-105, 45], [-98, 46], [-90, 45],
  [-82, 44], [-75, 42], [-122, 38], [-113, 38], [-105, 37], [-95, 37],
  [-87, 35], [-78, 35], [-115, 32], [-105, 30], [-98, 30], [-90, 30],
  [-82, 28], [-105, 22], [-95, 18], [-88, 16],
  [-77, 18], [-70, 18], [-66, 18],
  [-78, 4], [-70, -2], [-62, -5], [-52, -6], [-72, -12], [-65, -15], [-58, -18],
  [-68, -22], [-57, -25], [-48, -18], [-52, -28], [-65, -30], [-58, -33],
  [-68, -38], [-72, -42], [-70, -48], [-72, -52],
  [-8, 54], [-3, 56], [-18, 64],
  [-5, 40], [0, 43], [5, 46], [10, 50], [15, 52], [20, 55], [25, 58],
  [12, 42], [18, 45], [25, 45], [30, 50], [5, 50],
  [15, 62], [22, 65], [28, 62], [35, 60], [42, 60], [38, 65],
  [-10, 30], [0, 28], [10, 25], [20, 25], [30, 26], [35, 20], [-12, 18],
  [-5, 18], [5, 14], [12, 14], [20, 15], [28, 16], [33, 14],
  [-8, 10], [0, 8], [12, 6], [22, 5], [32, 8], [40, 8], [45, 4],
  [20, -2], [28, -5], [35, -5], [40, -2],
  [18, -12], [25, -15], [32, -13], [38, -15], [20, -22], [28, -22], [32, -25],
  [20, -30], [25, -30], [18, -33],
  [47, -18], [48, -22],
  [40, 32], [44, 30], [50, 26], [55, 22], [52, 18],
  [55, 55], [65, 58], [75, 60], [85, 62], [95, 64], [105, 62], [115, 62],
  [125, 62], [135, 62], [148, 62], [160, 62], [170, 65],
  [60, 45], [70, 45], [80, 48], [90, 48], [100, 48], [110, 50], [120, 50],
  [135, 48], [148, 52],
  [58, 38], [68, 38], [78, 40], [88, 42], [100, 40], [108, 40], [118, 42],
  [72, 26], [82, 26], [90, 26], [100, 28], [110, 30], [118, 32], [125, 32],
  [72, 18], [78, 14], [84, 20], [95, 20], [100, 14], [107, 10],
  [115, 3], [112, -3], [118, -1], [125, -3], [132, -6], [137, -4],
  [120, 10], [122, 14], [124, 8],
  [138, 36], [141, 40], [142, 44],
  [115, -22], [125, -22], [135, -22], [145, -22], [132, -15], [150, -28],
  [145, -33], [138, -33], [150, -38],
  [170, -40], [175, -43], [173, -46],
]

const LAT_MAX = 85
const LAT_RANGE = LAT_MAX * 2

function project(lng: number, lat: number): { x: number; y: number } {
  const x = ((lng + 180) / 360) * 100
  const clamped = Math.max(-LAT_MAX, Math.min(LAT_MAX, lat))
  const y = ((LAT_MAX - clamped) / LAT_RANGE) * 50
  return { x, y }
}

function arcPath(from: City, to: City, curveScale = 0.28): string {
  const p1 = project(from.lng, from.lat)
  const p2 = project(to.lng, to.lat)
  const mx = (p1.x + p2.x) / 2
  const my = (p1.y + p2.y) / 2
  const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y)
  const curve = Math.min(dist * curveScale, 8)
  return `M ${p1.x} ${p1.y} Q ${mx} ${my - curve} ${p2.x} ${p2.y}`
}

function compoundArcPath(edges: Array<[string, string]>, curveScale = 0.3): string {
  return edges.reduce<string>((acc, [aCode, bCode], i) => {
    const a = CITIES[idx(aCode)]
    const b = CITIES[idx(bCode)]
    const p1 = project(a.lng, a.lat)
    const p2 = project(b.lng, b.lat)
    const mx = (p1.x + p2.x) / 2
    const my = (p1.y + p2.y) / 2
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y)
    const curve = Math.min(dist * curveScale, 8)
    if (i === 0) return `M ${p1.x} ${p1.y} Q ${mx} ${my - curve} ${p2.x} ${p2.y}`
    return acc + ` Q ${mx} ${my - curve} ${p2.x} ${p2.y}`
  }, '')
}

// Lifestyle stats (real)
const STATS: {
  value: number
  suffix: string
  label: string
  sublabel: string
  accent: Accent
}[] = [
  { value: 15, suffix: '+', label: 'Countries coded from', sublabel: 'passport.stamps', accent: 'accent' },
  { value: 5, suffix: '+', label: 'Years as a nomad', sublabel: 'in.flight', accent: 'lime' },
  { value: 1000, suffix: '+', label: 'Cafés explored', sublabel: 'espresso.shots', accent: 'electric' },
  { value: 500, suffix: '+', label: 'Local dishes tried', sublabel: 'menu.items', accent: 'amber' },
]

// Travel imagery — "the office moves with me" (boarding-pass noise removed)
const PLACES: {
  image: string
  title: string
  location: string
  description: string
  icon: LucideIcon
}[] = [
  {
    image:
      'https://images.unsplash.com/photo-1649061267116-bf9d813b3757?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwbm9tYWQlMjBsYXB0b3AlMjBjYWZlfGVufDF8fHx8MTc2NTMyNTcwNHww&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Café coding',
    location: 'Tokyo, Japan',
    description: 'Best matcha lattes while debugging',
    icon: Coffee,
  },
  {
    image:
      'https://images.unsplash.com/photo-1609765685592-703a97c877ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhaXJwbGFuZSUyMHdpbmRvdyUyMHRyYXZlbHxlbnwxfHx8fDE3NjUzMDE2MTF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Cloud office',
    location: '35,000 ft',
    description: 'Where merge conflicts meet turbulence',
    icon: Plane,
  },
  {
    image:
      'https://images.unsplash.com/photo-1652793822328-47340b1b4407?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwd2Fsa2luZyUyMHN0cmVldHxlbnwxfHx8fDE3NjUzMjU3MDR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'City explorer',
    location: 'Street markets',
    description: 'Best ideas come while walking',
    icon: MapPin,
  },
  {
    image:
      'https://images.unsplash.com/photo-1758767055219-35755e2d76bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJlZXQlMjBmb29kJTIwY3VsdHVyZXxlbnwxfHx8fDE3NjUzMjU3MDR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Food adventures',
    location: 'Everywhere',
    description: 'Trying local cuisines between commits',
    icon: Utensils,
  },
]

function useUtcMinute() {
  const [t, setT] = useState(() => new Date().toISOString().slice(11, 16))
  useEffect(() => {
    const id = setInterval(() => setT(new Date().toISOString().slice(11, 16)), 30_000)
    return () => clearInterval(id)
  }, [])
  return t
}

export function NomadLife() {
  const { reduceMotion } = useFxLevel()
  const utc = useUtcMinute()
  const current = CITIES.find((c) => c.current)!

  return (
    <SectionShell id="nomad-section">
      <SectionHeading
        align="between"
        eyebrow="nomad.log"
        meta={
          <span className="inline-flex items-center gap-2 tabular-nums">
            <HudDot accent="lime" />
            {current.name} · {utc} UTC
          </span>
        }
        title={
          <>
            <FxWord className="italic font-extrabold">Nomading</FxWord> across Asia
            with <FxWord className="italic font-extrabold">the fam</FxWord> and a
            laptop.
          </>
        }
        intro="Based in Asia and moving between cities with family in tow — building products between flights, markets, and good coffee."
      />

      {/* world map */}
      <Reveal className="mt-12">
        <WorldMap reduceMotion={reduceMotion} />
      </Reveal>

      {/* stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.06}>
            <GlassPanel accent={s.accent} accentTop={false} className="p-4 h-full">
              <div className={`font-display text-3xl md:text-4xl font-bold tabular-nums ${ACCENT[s.accent].text}`}>
                <AnimatedNumber value={s.value} suffix={s.suffix} />
              </div>
              <div className="mt-1.5 text-sm font-medium text-ink">{s.label}</div>
              <div className="font-mono text-[10px] text-ink-soft mt-0.5">{s.sublabel}</div>
            </GlassPanel>
          </Reveal>
        ))}
      </div>

      {/* travel imagery */}
      <div className="mt-14">
        <div className="flex items-center gap-3 mb-5 font-mono text-[11px] tracking-[0.22em] uppercase text-ink-soft">
          <span className="text-accent">&gt;</span>
          <span>the office moves with me</span>
          <span className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {PLACES.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.06}>
              <PlaceCard place={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </SectionShell>
  )
}

function PlaceCard({ place }: { place: (typeof PLACES)[number] }) {
  const Icon = place.icon
  return (
    <div className="group relative rounded-2xl overflow-hidden border border-border/60 aspect-[4/5] bg-surface">
      <img
        src={place.image}
        alt={place.title}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[hsl(253_38%_8%/0.9)] via-[hsl(253_38%_8%/0.25)] to-transparent" />
      <div className="absolute bottom-0 inset-x-0 p-4 text-white">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-white/75">
          <Icon className="w-3 h-3" />
          {place.location}
        </div>
        <div className="font-display font-bold text-lg leading-tight mt-1">
          {place.title}
        </div>
        <div className="text-[12px] text-white/80 mt-0.5 leading-snug">
          {place.description}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// WorldMap — calm equirectangular map: dotted continents, faint
// route web, one glowing active route flown by a single plane,
// cities, and the "you are here" beacon on Bangkok.
// ============================================================

function WorldMap({ reduceMotion }: { reduceMotion: boolean }) {
  const current = CITIES.find((c) => c.current)!
  const currentProj = project(current.lng, current.lat)
  const planePath = compoundArcPath(ACTIVE_EDGES, 0.32)
  const lngGrid = [-120, -60, 0, 60, 120]
  const latGrid = [-30, 0, 30, 60]

  // small ambient city-to-city hops for extra life [from, to, durationSeconds]
  const ambient: Array<[string, string, number]> = [
    ['TPE', 'TYO', 5],
    ['BLI', 'SYD', 6],
    ['MAD', 'BLQ', 4.5],
    ['HKG', 'SIN', 5.5],
  ]

  return (
    <div className="relative rounded-2xl border border-ink/10 overflow-hidden">
      {/* header */}
      <div className="relative z-10 flex items-center gap-2 px-4 py-2.5 border-b border-ink/[0.07] bg-background/20 backdrop-blur-sm font-mono text-[10.5px] text-ink-soft">
        <MapPin className="w-3.5 h-3.5 text-accent" />
        <span className="text-ink">world.map</span>
        <span>· {CITIES.length} cities · 4 continents</span>
        <span className="ml-auto inline-flex items-center gap-1.5 uppercase tracking-[0.16em] text-[9.5px]">
          <HudDot accent="lime" />
          live
        </span>
      </div>

      <div className="relative aspect-[2/1] overflow-hidden">
        {/* soft spotlight on current city */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-80"
          style={{
            background: `radial-gradient(circle at ${currentProj.x}% ${(currentProj.y / 50) * 100}%, hsl(var(--accent) / 0.14), transparent 42%)`,
          }}
        />
        <svg viewBox="0 0 100 50" preserveAspectRatio="xMidYMid meet" className="relative w-full h-full">
          <defs>
            <linearGradient id="nomad-active" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(var(--accent))" />
              <stop offset="50%" stopColor="hsl(var(--lime))" />
              <stop offset="100%" stopColor="hsl(var(--amber))" />
            </linearGradient>
            <path id="nomad-active-path" d={planePath} fill="none" />
            {/* airplane silhouette — nose at +X, centered on origin */}
            <path
              id="nomad-plane"
              d="M 1.05 0 L 0.5 0.2 L 0.08 0.22 L -0.12 0.6 L -0.32 0.6 L -0.14 0.18 L -0.72 0.13 L -0.85 0.34 L -0.99 0.34 L -0.9 0 L -0.99 -0.34 L -0.85 -0.34 L -0.72 -0.13 L -0.14 -0.18 L -0.32 -0.6 L -0.12 -0.6 L 0.08 -0.22 L 0.5 -0.2 Z"
              fill="currentColor"
              stroke="hsl(var(--background))"
              strokeWidth="0.07"
              strokeLinejoin="round"
            />
            {ambient.map(([a, b], i) => (
              <path
                key={`ampath-${i}`}
                id={`nomad-amb-${i}`}
                d={arcPath(CITIES[idx(a)], CITIES[idx(b)], 0.3)}
                fill="none"
              />
            ))}
          </defs>

          {/* grid */}
          {lngGrid.map((lng) => {
            const x = project(lng, 0).x
            return (
              <line key={`lng-${lng}`} x1={x} y1="0" x2={x} y2="50" stroke="hsl(var(--border))" strokeWidth="0.1" strokeDasharray="0.6 1.2" opacity={lng === 0 ? 0.55 : 0.3} />
            )
          })}
          {latGrid.map((lat) => {
            const y = project(0, lat).y
            return (
              <line key={`lat-${lat}`} x1="0" y1={y} x2="100" y2={y} stroke="hsl(var(--border))" strokeWidth="0.1" strokeDasharray="0.6 1.2" opacity={lat === 0 ? 0.55 : 0.3} />
            )
          })}

          {/* continents */}
          <motion.g
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: reduceMotion ? 0 : 1.4, delay: 0.1 }}
          >
            {LAND_DOTS.map(([lng, lat], i) => {
              const p = project(lng, lat)
              return <circle key={`dot-${i}`} cx={p.x} cy={p.y} r="0.38" fill="hsl(var(--ink))" opacity="0.38" />
            })}
          </motion.g>

          {/* faint route web */}
          {ROUTE_EDGES.map(([aCode, bCode], i) => {
            const d = arcPath(CITIES[idx(aCode)], CITIES[idx(bCode)], 0.28)
            return (
              <motion.path
                key={`edge-${aCode}-${bCode}`}
                d={d}
                fill="none"
                stroke="hsl(var(--ink-soft))"
                strokeWidth="0.16"
                strokeDasharray="0.8 0.9"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 0.5 }}
                viewport={{ once: true }}
                transition={{ duration: reduceMotion ? 0 : 1.2, delay: reduceMotion ? 0 : 0.3 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              />
            )
          })}

          {/* active route — glow underlay + crisp stroke */}
          {ACTIVE_EDGES.map(([aCode, bCode], i) => {
            const d = arcPath(CITIES[idx(aCode)], CITIES[idx(bCode)], 0.32)
            return (
              <g key={`active-${aCode}-${bCode}`}>
                <motion.path
                  d={d}
                  fill="none"
                  stroke="url(#nomad-active)"
                  strokeWidth="1.1"
                  strokeLinecap="round"
                  opacity="0.3"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: reduceMotion ? 0 : 2, delay: reduceMotion ? 0 : 0.8 + i * 0.4, ease: [0.22, 1, 0.36, 1] }}
                />
                <motion.path
                  d={d}
                  fill="none"
                  stroke="url(#nomad-active)"
                  strokeWidth="0.42"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: reduceMotion ? 0 : 2, delay: reduceMotion ? 0 : 0.9 + i * 0.4, ease: [0.22, 1, 0.36, 1] }}
                />
              </g>
            )
          })}

          {/* ===== main airplane flying the active route, with a contrail ===== */}
          {!reduceMotion && (
            <g style={{ color: 'hsl(var(--amber))' }}>
              {/* contrail dots trailing behind the plane */}
              {[
                { beg: -1.88, op: 0.5, r: 0.34 },
                { beg: -1.76, op: 0.4, r: 0.28 },
                { beg: -1.64, op: 0.3, r: 0.22 },
                { beg: -1.52, op: 0.2, r: 0.17 },
              ].map((p, i) => (
                <circle key={`trail-${i}`} r={p.r} fill="hsl(var(--amber))" opacity="0">
                  <animate
                    attributeName="opacity"
                    values={`0;${p.op};${p.op};0`}
                    keyTimes="0;0.06;0.9;1"
                    dur="8s"
                    begin={`${p.beg}s`}
                    repeatCount="indefinite"
                  />
                  <animateMotion dur="8s" begin={`${p.beg}s`} repeatCount="indefinite">
                    <mpath href="#nomad-active-path" />
                  </animateMotion>
                </circle>
              ))}
              {/* soft glow halo */}
              <circle r="2.3" fill="hsl(var(--amber))" opacity="0">
                <animate attributeName="opacity" values="0;0.2;0.2;0" keyTimes="0;0.06;0.9;1" dur="8s" begin="-2s" repeatCount="indefinite" />
                <animateMotion dur="8s" begin="-2s" repeatCount="indefinite">
                  <mpath href="#nomad-active-path" />
                </animateMotion>
              </circle>
              {/* the plane — banks to its heading, fades at the loop seam */}
              <g opacity="0">
                <use href="#nomad-plane" transform="scale(2.3)" />
                <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.93;1" dur="8s" begin="-2s" repeatCount="indefinite" />
                <animateMotion dur="8s" begin="-2s" rotate="auto" repeatCount="indefinite">
                  <mpath href="#nomad-active-path" />
                </animateMotion>
              </g>
            </g>
          )}

          {/* ===== smaller ambient planes hopping between Asian cities ===== */}
          {!reduceMotion &&
            ambient.map(([, , dur], i) => (
              <g key={`ambplane-${i}`} style={{ color: 'hsl(var(--lime))' }} opacity="0">
                <use href="#nomad-plane" transform="scale(2.3)" />
                <animate attributeName="opacity" values="0;0.8;0.8;0" keyTimes="0;0.12;0.85;1" dur={`${dur}s`} begin={`${-i * 1.9}s`} repeatCount="indefinite" />
                <animateMotion dur={`${dur}s`} begin={`${-i * 1.9}s`} rotate="auto" repeatCount="indefinite">
                  <mpath href={`#nomad-amb-${i}`} />
                </animateMotion>
              </g>
            ))}

          {/* cities */}
          {CITIES.map((c) => {
            const p = project(c.lng, c.lat)
            const isCurrent = !!c.current
            const dx = c.labelDx ?? 1.6
            const dy = c.labelDy ?? -1.3
            const anchor = c.labelAnchor ?? 'start'
            return (
              <g key={c.code}>
                {isCurrent && !reduceMotion && (
                  <circle cx={p.x} cy={p.y} r="1.2" fill="none" stroke="hsl(var(--accent))" strokeWidth="0.18" opacity="0.7">
                    <animate attributeName="r" from="1.2" to="5" dur="2.6s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.7" to="0" dur="2.6s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isCurrent ? 1.1 : 0.65}
                  fill={isCurrent ? 'hsl(var(--accent))' : 'hsl(var(--ink))'}
                  stroke={isCurrent ? 'hsl(var(--background))' : 'none'}
                  strokeWidth={isCurrent ? 0.25 : 0}
                />
                <text
                  x={p.x + dx}
                  y={p.y + dy}
                  fontSize="1.5"
                  fill={isCurrent ? 'hsl(var(--accent))' : 'hsl(var(--ink))'}
                  fontFamily="'JetBrains Mono', monospace"
                  fontWeight={isCurrent ? 700 : 500}
                  textAnchor={anchor}
                  opacity="0.92"
                >
                  {c.code}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* footer strip */}
      <div className="relative z-10 flex flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2.5 border-t border-ink/[0.07] bg-background/20 backdrop-blur-sm font-mono text-[10px] text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          you are here · {current.name}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-px bg-amber" />
          active tour · BKK → MAD → NYC → LAX
        </span>
        <span className="ml-auto">184,302 mi flown</span>
      </div>
    </div>
  )
}
