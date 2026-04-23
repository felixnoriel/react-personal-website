import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Clock,
  Coffee,
  Compass,
  MapPin,
  Plane,
  Utensils,
  Wifi,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AnimatedNumber } from './ui/AnimatedNumber'
import { trackEvent } from '../utils/analytics'

// ============================================================
// DATA — cities with real lat/lng + global flight plan
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
  // Home / origin
  { code: 'MNL', name: 'Manila', lng: 120.98, lat: 14.6 },
  // Current base
  {
    code: 'BKK',
    name: 'Bangkok',
    lng: 100.5,
    lat: 13.75,
    current: true,
    labelDx: -2,
    labelAnchor: 'end',
  },
  {
    code: 'HKG',
    name: 'Hong Kong',
    lng: 114.17,
    lat: 22.32,
    labelDx: -2,
    labelAnchor: 'end',
  },
  { code: 'TPE', name: 'Taipei', lng: 121.5, lat: 25.05 },
  { code: 'SEL', name: 'Seoul', lng: 126.98, lat: 37.57 },
  { code: 'TYO', name: 'Tokyo', lng: 139.77, lat: 35.68 },
  { code: 'SIN', name: 'Singapore', lng: 103.82, lat: 1.35, labelDy: 2.8 },
  { code: 'BLI', name: 'Bali', lng: 115.21, lat: -8.5, labelDy: 2.8 },
  // Oceania
  { code: 'SYD', name: 'Sydney', lng: 151.21, lat: -33.87 },
  // Americas
  { code: 'NYC', name: 'New York', lng: -74, lat: 40.71 },
  { code: 'LAX', name: 'Los Angeles', lng: -118.24, lat: 34.05 },
  {
    code: 'YYZ',
    name: 'Toronto',
    lng: -79.38,
    lat: 43.65,
    labelDx: -2,
    labelAnchor: 'end',
  },
  // Europe
  {
    code: 'MAD',
    name: 'Madrid',
    lng: -3.7,
    lat: 40.42,
    labelDx: -2,
    labelAnchor: 'end',
  },
  { code: 'BLQ', name: 'Bologna', lng: 11.34, lat: 44.49, labelDy: 2.8 },
  { code: 'MUC', name: 'Munich', lng: 11.58, lat: 48.14 },
]

// Index helpers
const idx = (code: string): number => CITIES.findIndex((c) => c.code === code)

// Sequential flight plan edges (all stay within ±180° span so none cross the dateline)
const ROUTE_EDGES: Array<[string, string]> = [
  // Asia loop
  ['MNL', 'TPE'],
  ['TPE', 'TYO'],
  ['TYO', 'SEL'],
  ['SEL', 'HKG'],
  ['HKG', 'MNL'],
  ['MNL', 'BKK'],
  ['BKK', 'SIN'],
  ['SIN', 'BLI'],
  ['BLI', 'SYD'],
  // Asia → Europe
  ['MNL', 'MAD'],
  ['MAD', 'BLQ'],
  ['BLQ', 'MUC'],
  // Europe → Americas
  ['MAD', 'NYC'],
  ['MUC', 'NYC'],
  // Americas
  ['NYC', 'YYZ'],
  ['NYC', 'LAX'],
  ['LAX', 'YYZ'],
]

// Highlighted "active" route — a westward world tour starting from current base
const ACTIVE_EDGES: Array<[string, string]> = [
  ['BKK', 'MAD'],
  ['MAD', 'NYC'],
  ['NYC', 'LAX'],
]

// ============================================================
// LAND DOTS — stylized dotted continents (lng, lat)
// ============================================================

const LAND_DOTS: Array<[number, number]> = [
  // Alaska / Canada / Greenland
  [-155, 66], [-145, 65], [-135, 62], [-125, 60], [-115, 60], [-105, 62],
  [-95, 62], [-85, 65], [-75, 68], [-65, 60], [-55, 55], [-45, 72], [-38, 65],
  [-50, 76], [-25, 72],
  // USA / Mexico
  [-125, 48], [-118, 45], [-112, 45], [-105, 45], [-98, 46], [-90, 45],
  [-82, 44], [-75, 42], [-122, 38], [-113, 38], [-105, 37], [-95, 37],
  [-87, 35], [-78, 35], [-115, 32], [-105, 30], [-98, 30], [-90, 30],
  [-82, 28], [-105, 22], [-95, 18], [-88, 16],
  // Caribbean
  [-77, 18], [-70, 18], [-66, 18],
  // South America
  [-78, 4], [-70, -2], [-62, -5], [-52, -6], [-72, -12], [-65, -15], [-58, -18],
  [-68, -22], [-57, -25], [-48, -18], [-52, -28], [-65, -30], [-58, -33],
  [-68, -38], [-72, -42], [-70, -48], [-72, -52],
  // UK / Ireland / Iceland
  [-8, 54], [-3, 56], [-18, 64],
  // Europe core
  [-5, 40], [0, 43], [5, 46], [10, 50], [15, 52], [20, 55], [25, 58],
  [12, 42], [18, 45], [25, 45], [30, 50], [5, 50],
  // Scandinavia / Russia west
  [15, 62], [22, 65], [28, 62], [35, 60], [42, 60], [38, 65],
  // Africa north & Sahel
  [-10, 30], [0, 28], [10, 25], [20, 25], [30, 26], [35, 20], [-12, 18],
  [-5, 18], [5, 14], [12, 14], [20, 15], [28, 16], [33, 14],
  // Africa central / east
  [-8, 10], [0, 8], [12, 6], [22, 5], [32, 8], [40, 8], [45, 4],
  [20, -2], [28, -5], [35, -5], [40, -2],
  // Africa south
  [18, -12], [25, -15], [32, -13], [38, -15], [20, -22], [28, -22], [32, -25],
  [20, -30], [25, -30], [18, -33],
  // Madagascar
  [47, -18], [48, -22],
  // Middle East
  [40, 32], [44, 30], [50, 26], [55, 22], [52, 18],
  // Asia / Russia
  [55, 55], [65, 58], [75, 60], [85, 62], [95, 64], [105, 62], [115, 62],
  [125, 62], [135, 62], [148, 62], [160, 62], [170, 65],
  [60, 45], [70, 45], [80, 48], [90, 48], [100, 48], [110, 50], [120, 50],
  [135, 48], [148, 52],
  // Central Asia
  [58, 38], [68, 38], [78, 40], [88, 42], [100, 40], [108, 40], [118, 42],
  // India / SE Asia / China coast
  [72, 26], [82, 26], [90, 26], [100, 28], [110, 30], [118, 32], [125, 32],
  [72, 18], [78, 14], [84, 20], [95, 20], [100, 14], [107, 10],
  // Indonesia / Philippines archipelago
  [115, 3], [112, -3], [118, -1], [125, -3], [132, -6], [137, -4],
  [120, 10], [122, 14], [124, 8],
  // Japan
  [138, 36], [141, 40], [142, 44],
  // Australia
  [115, -22], [125, -22], [135, -22], [145, -22], [132, -15], [150, -28],
  [145, -33], [138, -33], [150, -38],
  // New Zealand
  [170, -40], [175, -43], [173, -46],
]

// ============================================================
// WORKSPACES → BOARDING PASSES (updated routes to reflect the expanded globe)
// ============================================================

type Workspace = {
  image: string
  title: string
  location: string
  icon: LucideIcon
  description: string
  flight: string
  from: string
  to: string
  gate: string
  seat: string
  accent: 'accent' | 'lime' | 'electric' | 'amber'
}

const workspaces: Workspace[] = [
  {
    image:
      'https://images.unsplash.com/photo-1649061267116-bf9d813b3757?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwbm9tYWQlMjBsYXB0b3AlMjBjYWZlfGVufDF8fHx8MTc2NTMyNTcwNHww&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Cafe Coding',
    location: 'Tokyo, Japan',
    icon: Coffee,
    description: 'Best matcha lattes while debugging',
    flight: 'NOM-001',
    from: 'BKK',
    to: 'TYO',
    gate: 'B8',
    seat: '12A',
    accent: 'accent',
  },
  {
    image:
      'https://images.unsplash.com/photo-1609765685592-703a97c877ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhaXJwbGFuZSUyMHdpbmRvdyUyMHRyYXZlbHxlbnwxfHx8fDE3NjUzMDE2MTF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Cloud Office',
    location: '35,000 ft',
    icon: Plane,
    description: 'Where merge conflicts meet turbulence',
    flight: 'NOM-002',
    from: 'MAD',
    to: 'NYC',
    gate: 'C4',
    seat: '7F',
    accent: 'lime',
  },
  {
    image:
      'https://images.unsplash.com/photo-1652793822328-47340b1b4407?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwd2Fsa2luZyUyMHN0cmVldHxlbnwxfHx8fDE3NjUzMjU3MDR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'City Explorer',
    location: 'Street Markets',
    icon: MapPin,
    description: 'Best ideas come while walking',
    flight: 'NOM-003',
    from: 'BLQ',
    to: 'MUC',
    gate: 'D12',
    seat: '22C',
    accent: 'electric',
  },
  {
    image:
      'https://images.unsplash.com/photo-1758767055219-35755e2d76bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJlZXQlMjBmb29kJTIwY3VsdHVyZXxlbnwxfHx8fDE3NjUzMjU3MDR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Food Adventures',
    location: 'Everywhere',
    icon: Utensils,
    description: 'Trying local cuisines between commits',
    flight: 'NOM-004',
    from: 'BLI',
    to: 'SYD',
    gate: 'E2',
    seat: '4B',
    accent: 'amber',
  },
]

const ACCENT_CLS: Record<
  Workspace['accent'],
  { text: string; bg: string; bar: string; dot: string; glow: string }
> = {
  accent: {
    text: 'text-accent',
    bg: 'bg-accent/10',
    bar: 'bg-accent',
    dot: 'bg-accent',
    glow: 'shadow-[0_0_24px_hsl(var(--accent)/0.5)]',
  },
  lime: {
    text: 'text-lime',
    bg: 'bg-lime/15',
    bar: 'bg-lime',
    dot: 'bg-lime',
    glow: 'shadow-[0_0_24px_hsl(var(--lime)/0.55)]',
  },
  electric: {
    text: 'text-electric',
    bg: 'bg-electric/10',
    bar: 'bg-electric',
    dot: 'bg-electric',
    glow: 'shadow-[0_0_24px_hsl(var(--electric)/0.55)]',
  },
  amber: {
    text: 'text-amber',
    bg: 'bg-amber/10',
    bar: 'bg-amber',
    dot: 'bg-amber',
    glow: 'shadow-[0_0_24px_hsl(var(--amber)/0.55)]',
  },
}

const lifestyleStats: {
  value: number
  suffix?: string
  label: string
  sublabel: string
  accent: Workspace['accent']
}[] = [
  {
    value: 15,
    suffix: '+',
    label: 'Countries coded from',
    sublabel: 'passport.stamps',
    accent: 'accent',
  },
  {
    value: 5,
    suffix: '+',
    label: 'Years as nomad',
    sublabel: 'in.flight',
    accent: 'lime',
  },
  {
    value: 1000,
    suffix: '+',
    label: 'Cafes explored',
    sublabel: 'espresso.shots',
    accent: 'electric',
  },
  {
    value: 500,
    suffix: '+',
    label: 'Local dishes tried',
    sublabel: 'menu.items',
    accent: 'amber',
  },
]

const TICKER_ITEMS = [
  '● now in Bangkok, TH',
  'tz: GMT+7',
  'alt: sea-level → 35,000ft',
  'uplink: strong · 5/5 bars',
  'wx: 33°C · humid · sun',
  'coffee.shots: 4,782',
  'next.flight: BKK → MAD · 06:20',
  'total.miles: 184,302',
  '✈ currently boarding',
  'mood: wanderlust.exe',
  '15 cities · 4 continents',
]

// ============================================================
// Projection helpers (equirectangular world map)
// viewBox is 0 0 100 50 — 1 unit x = 3.6° lng, 1 unit y = 3.6° lat
// ============================================================

const LAT_MAX = 85
const LAT_RANGE = LAT_MAX * 2 // 170° span so the poles are cropped a touch

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

function compoundArcPath(edges: Array<[string, string]>, curveScale = 0.28): string {
  return edges.reduce<string>((acc, [aCode, bCode], i) => {
    const a = CITIES[idx(aCode)]
    const b = CITIES[idx(bCode)]
    const p1 = project(a.lng, a.lat)
    const p2 = project(b.lng, b.lat)
    const mx = (p1.x + p2.x) / 2
    const my = (p1.y + p2.y) / 2
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y)
    const curve = Math.min(dist * curveScale, 8)
    if (i === 0) {
      return `M ${p1.x} ${p1.y} Q ${mx} ${my - curve} ${p2.x} ${p2.y}`
    }
    return acc + ` Q ${mx} ${my - curve} ${p2.x} ${p2.y}`
  }, '')
}

// ============================================================
// Helper: live UTC clock
// ============================================================

function useLiveTime() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])
  return now
}

// ============================================================
// Root
// ============================================================

export function NomadLife() {
  const reduceMotion = !!useReducedMotion()
  return (
    <section
      id="nomad-section"
      className="relative py-24 md:py-32 bg-background scroll-mt-20 overflow-hidden border-y border-border"
    >
      {/* ambient glows */}
      <div
        aria-hidden
        className="absolute right-0 top-12 w-[45%] h-[55%] pointer-events-none opacity-70"
        style={{
          background:
            'radial-gradient(ellipse at top right, hsl(var(--lime) / 0.08), transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="absolute left-0 bottom-16 w-[40%] h-[50%] pointer-events-none opacity-60"
        style={{
          background:
            'radial-gradient(ellipse at bottom left, hsl(var(--accent) / 0.07), transparent 70%)',
        }}
      />
      {/* floating plane decor (reduced-motion respected) */}
      <FloatingPlaneDecor />

      <div className="container relative mx-auto px-6 max-w-6xl">
        {/* ===================== HEADER ===================== */}
        <NomadHeader />

        {/* ===================== FLIGHT RADAR ===================== */}
        <div className="mt-10 md:mt-12">
          <FlightRadar reduceMotion={reduceMotion} />
        </div>

        {/* ===================== BOARDING PASSES ===================== */}
        <div className="mt-12 md:mt-16">
          <SectionDivider
            title="boarding.passes"
            meta={`${workspaces.length.toString().padStart(2, '0')} routes`}
          />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {workspaces.map((ws, i) => (
              <BoardingPassCard key={ws.title} ws={ws} index={i} />
            ))}
          </div>
        </div>

        {/* ===================== DEPARTURES BOARD ===================== */}
        <div className="mt-12 md:mt-16">
          <SectionDivider
            title="departures.board"
            meta="lifetime stats · verified"
          />
          <DeparturesBoard />
        </div>

        {/* ===================== LIVE TICKER ===================== */}
        <div className="mt-10">
          <LiveTicker />
        </div>
      </div>
    </section>
  )
}

// ============================================================
// Header — "nomad.log" meta strip + title
// ============================================================

function NomadHeader() {
  const now = useLiveTime()
  const utcTime = now.toISOString().slice(11, 16)
  const current = CITIES.find((c) => c.current)!

  return (
    <motion.header
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs tracking-[0.22em] uppercase text-ink-muted mb-5 font-mono">
        <span>— nomad.log</span>
        <span className="inline-flex items-center gap-1.5 normal-case text-[10px] text-lime tracking-normal">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-lime opacity-75 animate-ping" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
          </span>
          active feed
        </span>
        <span className="inline-flex items-center gap-1.5 normal-case text-[10px] text-ink-soft tracking-normal">
          <Plane className="w-3 h-3 text-amber -rotate-12" />
          <span>in transit</span>
        </span>
        <span className="inline-flex items-center gap-1.5 normal-case text-[10px] text-ink-soft tracking-normal">
          <MapPin className="w-3 h-3 text-accent" />
          <span>
            currently:{' '}
            <span className="text-ink font-semibold">{current.name}</span>
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5 normal-case text-[10px] text-ink-soft tracking-normal">
          <Clock className="w-3 h-3 text-electric" />
          <span className="tabular-nums">{utcTime} UTC</span>
        </span>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-2xl">
          <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tighter text-ink text-balance">
            Nomading across Asia with{' '}
            <span className="italic font-extrabold text-accent">the fam</span>{' '}
            and a laptop.
          </h2>
        </div>
        <p className="md:max-w-sm text-ink-muted leading-relaxed">
          Based in Asia and moving between cities with family in tow —
          building products between flights, markets, and good coffee.
        </p>
      </div>
    </motion.header>
  )
}

// ============================================================
// SectionDivider
// ============================================================

function SectionDivider({ title, meta }: { title: string; meta?: string }) {
  return (
    <div className="mb-5 flex items-center gap-3 font-mono text-[11px] tracking-[0.22em] uppercase text-ink-soft">
      <span className="text-accent">&gt;</span>
      <span className="text-ink">{title}</span>
      <span className="flex-1 h-px bg-gradient-to-r from-border via-border to-transparent" />
      {meta && (
        <span className="text-ink-soft normal-case tracking-normal">{meta}</span>
      )}
    </div>
  )
}

// ============================================================
// FloatingPlaneDecor
// ============================================================

function FloatingPlaneDecor() {
  const reduceMotion = useReducedMotion()
  if (reduceMotion) return null
  return (
    <>
      <motion.span
        aria-hidden
        initial={{ x: '-10%', y: 40, opacity: 0 }}
        animate={{ x: '110%', y: -20, opacity: [0, 0.25, 0.25, 0] }}
        transition={{
          duration: 42,
          ease: 'linear',
          repeat: Infinity,
          delay: 3,
        }}
        className="absolute top-[18%] left-0 right-0 pointer-events-none z-0 text-ink-soft/60"
      >
        <Plane className="w-5 h-5 -rotate-[18deg]" />
      </motion.span>
      <motion.span
        aria-hidden
        initial={{ x: '110%', y: 30, opacity: 0 }}
        animate={{ x: '-10%', y: -10, opacity: [0, 0.2, 0.2, 0] }}
        transition={{
          duration: 58,
          ease: 'linear',
          repeat: Infinity,
          delay: 18,
        }}
        className="absolute top-[68%] left-0 right-0 pointer-events-none z-0 text-lime/60"
      >
        <Plane className="w-4 h-4 rotate-[162deg]" />
      </motion.span>
    </>
  )
}

// ============================================================
// FlightRadar — world-map centerpiece with dotted continents
// ============================================================

function FlightRadar({ reduceMotion }: { reduceMotion: boolean }) {
  const now = useLiveTime()
  const utcTime = now.toISOString().slice(11, 16)
  const current = CITIES.find((c) => c.current)!
  const currentProj = project(current.lng, current.lat)
  const livePlanePath = compoundArcPath(ACTIVE_EDGES, 0.32)

  // Grid line positions
  const lngGridLines = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150]
  const latGridLines = [-60, -30, 0, 30, 60]

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-2xl border border-border bg-background overflow-hidden shadow-[0_40px_100px_-50px_hsl(var(--accent)/0.3)]"
    >
      {/* top window chrome */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-border bg-ink text-background">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        </span>
        <span className="font-mono text-[10.5px] text-white/75 ml-2 truncate">
          globe.radar · live.feed · v2.{new Date().getFullYear()}
        </span>
        <span className="ml-auto flex items-center gap-3 font-mono text-[10px] text-white/55">
          <span className="inline-flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-lime opacity-75 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
            </span>
            online
          </span>
          <span className="hidden sm:inline">gmt+8</span>
          <span className="hidden sm:inline text-white/30">·</span>
          <span className="tabular-nums text-white/85">{utcTime} UTC</span>
        </span>
      </div>

      {/* map area */}
      <div className="relative aspect-[16/10] md:aspect-[2/1] bg-gradient-to-br from-surface/40 via-background to-lime-soft/15 overflow-hidden">
        {/* globe curvature vignette (darken corners) */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-80"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 50%, hsl(var(--ink) / 0.09) 85%, hsl(var(--ink) / 0.18) 100%)',
          }}
        />
        {/* accent spotlight at current city */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-70"
          style={{
            background: `radial-gradient(circle at ${currentProj.x}% ${(currentProj.y / 50) * 100}%, hsl(var(--accent) / 0.14), transparent 50%)`,
          }}
        />

        {/* main SVG */}
        <svg
          viewBox="0 0 100 50"
          preserveAspectRatio="xMidYMid meet"
          className="relative w-full h-full"
        >
          <defs>
            <linearGradient id="active-route" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(var(--accent))" />
              <stop offset="50%" stopColor="hsl(var(--lime))" />
              <stop offset="100%" stopColor="hsl(var(--amber))" />
            </linearGradient>
            <radialGradient id="globe-ring" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor="hsl(var(--ink) / 0)" />
              <stop offset="85%" stopColor="hsl(var(--ink) / 0)" />
              <stop offset="100%" stopColor="hsl(var(--ink) / 0.1)" />
            </radialGradient>
          </defs>

          {/* globe sphere overlay — subtle ring giving planetary curvature */}
          <ellipse
            cx="50"
            cy="25"
            rx="48"
            ry="23"
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="0.15"
            strokeDasharray="0.5 0.8"
            opacity="0.7"
          />

          {/* latitude grid (horizontal dashed) */}
          {latGridLines.map((lat) => {
            const y = project(0, lat).y
            return (
              <line
                key={`lat-${lat}`}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="hsl(var(--border))"
                strokeWidth="0.1"
                strokeDasharray="0.6 1"
                opacity={lat === 0 ? 0.7 : 0.45}
              />
            )
          })}
          {/* equator label */}
          <text
            x="1"
            y={project(0, 0).y - 0.6}
            fontSize="1.2"
            fill="hsl(var(--ink-soft))"
            fontFamily="'JetBrains Mono', monospace"
            opacity="0.55"
          >
            equator · 0°
          </text>

          {/* longitude grid (vertical dashed) */}
          {lngGridLines.map((lng) => {
            const x = project(lng, 0).x
            return (
              <line
                key={`lng-${lng}`}
                x1={x}
                y1="0"
                x2={x}
                y2="50"
                stroke="hsl(var(--border))"
                strokeWidth="0.1"
                strokeDasharray="0.6 1"
                opacity={lng === 0 ? 0.7 : 0.4}
              />
            )
          })}
          {/* prime meridian label */}
          <text
            x={project(0, 0).x + 0.4}
            y={49.2}
            fontSize="1.2"
            fill="hsl(var(--ink-soft))"
            fontFamily="'JetBrains Mono', monospace"
            opacity="0.55"
          >
            0° prime
          </text>

          {/* dotted continents (fade in) */}
          <motion.g
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: reduceMotion ? 0 : 1.6, delay: 0.2 }}
          >
            {LAND_DOTS.map(([lng, lat], i) => {
              const p = project(lng, lat)
              return (
                <circle
                  key={`dot-${i}`}
                  cx={p.x}
                  cy={p.y}
                  r="0.38"
                  fill="hsl(var(--ink))"
                  opacity="0.38"
                />
              )
            })}
          </motion.g>

          {/* dashed inactive routes (draw in) */}
          {ROUTE_EDGES.map(([aCode, bCode], i) => {
            const a = CITIES[idx(aCode)]
            const b = CITIES[idx(bCode)]
            const d = arcPath(a, b, 0.28)
            return (
              <motion.path
                key={`edge-${aCode}-${bCode}`}
                d={d}
                fill="none"
                stroke="hsl(var(--ink-soft))"
                strokeWidth="0.18"
                strokeDasharray="0.8 0.8"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 0.55 }}
                viewport={{ once: true }}
                transition={{
                  duration: reduceMotion ? 0 : 1.4,
                  delay: reduceMotion ? 0 : 0.3 + i * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            )
          })}

          {/* active highlighted route (gradient) */}
          {ACTIVE_EDGES.map(([aCode, bCode], i) => {
            const a = CITIES[idx(aCode)]
            const b = CITIES[idx(bCode)]
            const d = arcPath(a, b, 0.32)
            return (
              <motion.path
                key={`active-${aCode}-${bCode}`}
                d={d}
                fill="none"
                stroke="url(#active-route)"
                strokeWidth="0.48"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: reduceMotion ? 0 : 2,
                  delay: reduceMotion ? 0 : 1 + i * 0.45,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            )
          })}

          {/* cities */}
          {CITIES.map((c, i) => {
            const p = project(c.lng, c.lat)
            const isCurrent = !!c.current
            const dx = c.labelDx ?? 1.6
            const dy = c.labelDy ?? -1.3
            const anchor = c.labelAnchor ?? 'start'
            return (
              <g key={c.code}>
                {/* pulse rings on current */}
                {isCurrent && !reduceMotion && (
                  <>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="1.2"
                      fill="none"
                      stroke="hsl(var(--accent))"
                      strokeWidth="0.18"
                      opacity="0.75"
                    >
                      <animate
                        attributeName="r"
                        from="1.2"
                        to="5"
                        dur="2.4s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        from="0.75"
                        to="0"
                        dur="2.4s"
                        repeatCount="indefinite"
                      />
                    </circle>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="1.2"
                      fill="none"
                      stroke="hsl(var(--accent))"
                      strokeWidth="0.18"
                      opacity="0.5"
                    >
                      <animate
                        attributeName="r"
                        from="1.2"
                        to="4"
                        dur="2.4s"
                        begin="1.2s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        from="0.5"
                        to="0"
                        dur="2.4s"
                        begin="1.2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  </>
                )}
                {/* city dot */}
                <motion.circle
                  cx={p.x}
                  cy={p.y}
                  r={isCurrent ? 1.1 : 0.7}
                  fill={isCurrent ? 'hsl(var(--accent))' : 'hsl(var(--ink))'}
                  stroke={isCurrent ? 'hsl(var(--background))' : 'none'}
                  strokeWidth={isCurrent ? 0.25 : 0}
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.45,
                    delay: reduceMotion ? 0 : 0.4 + i * 0.05,
                    type: 'spring',
                    stiffness: 220,
                    damping: 18,
                  }}
                  style={{
                    transformOrigin: `${p.x}px ${p.y}px`,
                    transformBox: 'fill-box',
                  }}
                />
                {/* label */}
                <motion.text
                  x={p.x + dx}
                  y={p.y + dy}
                  fontSize="1.5"
                  fill={isCurrent ? 'hsl(var(--accent))' : 'hsl(var(--ink))'}
                  fontFamily="'JetBrains Mono', monospace"
                  fontWeight={isCurrent ? 700 : 500}
                  textAnchor={anchor}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.4,
                    delay: reduceMotion ? 0 : 0.55 + i * 0.05,
                  }}
                >
                  {c.code}
                </motion.text>
                {isCurrent && (
                  <motion.text
                    x={p.x + dx}
                    y={p.y + dy + 1.9}
                    fontSize="1.1"
                    fill="hsl(var(--lime))"
                    fontFamily="'JetBrains Mono', monospace"
                    fontWeight={600}
                    textAnchor={anchor}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.4,
                      delay: reduceMotion ? 0 : 0.8,
                    }}
                  >
                    ● here
                  </motion.text>
                )}
              </g>
            )
          })}

          {/* live plane flying the active route */}
          {!reduceMotion && (
            <g>
              {/* halo */}
              <circle r="1.1" fill="hsl(var(--amber))" opacity="0.22">
                <animateMotion
                  dur="14s"
                  repeatCount="indefinite"
                  path={livePlanePath}
                  rotate="auto"
                />
              </circle>
              {/* core dot */}
              <circle r="0.55" fill="hsl(var(--amber))">
                <animateMotion
                  dur="14s"
                  repeatCount="indefinite"
                  path={livePlanePath}
                  rotate="auto"
                />
              </circle>
            </g>
          )}

          {/* secondary ambient planes — a subset of edges, nicely spaced */}
          {!reduceMotion &&
            [
              ['TPE', 'TYO'],
              ['SIN', 'BLI'],
              ['BLI', 'SYD'],
              ['MAD', 'BLQ'],
              ['NYC', 'YYZ'],
            ].map(([aCode, bCode], i) => {
              const a = CITIES[idx(aCode)]
              const b = CITIES[idx(bCode)]
              const d = arcPath(a, b, 0.3)
              return (
                <g key={`ambient-${aCode}-${bCode}`} opacity="0.55">
                  <circle r="0.36" fill="hsl(var(--lime))">
                    <animateMotion
                      dur={`${10 + i * 2}s`}
                      begin={`${i * 1.5}s`}
                      repeatCount="indefinite"
                      path={d}
                      rotate="auto"
                    />
                  </circle>
                </g>
              )
            })}

          {/* outer globe ring (very subtle) */}
          <rect
            x="0"
            y="0"
            width="100"
            height="50"
            fill="url(#globe-ring)"
            pointerEvents="none"
          />
        </svg>

        {/* HUD overlays */}
        <div className="absolute top-3 left-3 md:top-4 md:left-4 font-mono text-[10px] text-ink-soft bg-background/75 backdrop-blur px-2 py-1 rounded border border-border/70">
          <div className="flex items-center gap-1.5">
            <Compass className="w-3 h-3 text-electric" />
            <span>
              lat: <span className="text-ink tabular-nums">14.60°N</span>
              <span className="mx-1 text-ink-soft/60">·</span>
              lng: <span className="text-ink tabular-nums">120.98°E</span>
            </span>
          </div>
        </div>
        <div className="absolute top-3 right-3 md:top-4 md:right-4 font-mono text-[10px] text-ink-soft bg-background/75 backdrop-blur px-2 py-1 rounded border border-border/70">
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3 h-3 text-lime" />
            <span>
              uplink: <span className="text-ink">5/5</span>
              <span className="mx-1 text-ink-soft/60">·</span>
              <span className="tabular-nums">18ms</span>
            </span>
          </div>
        </div>
        <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4 font-mono text-[10px] text-ink-soft bg-background/75 backdrop-blur px-2 py-1 rounded border border-border/70">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span>
              <span className="text-ink tabular-nums">{ROUTE_EDGES.length}</span>{' '}
              routes
              <span className="mx-1 text-ink-soft/60">·</span>
              <span className="text-ink tabular-nums">{CITIES.length}</span>{' '}
              cities
            </span>
          </div>
        </div>
        <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4 font-mono text-[10px] text-ink-soft bg-background/75 backdrop-blur px-2 py-1 rounded border border-border/70 text-right">
          <div className="flex items-center gap-1.5 justify-end">
            <Plane className="w-3 h-3 text-amber" />
            <span>
              active:{' '}
              {ACTIVE_EDGES.flatMap(([a, b], i) => {
                const nodes =
                  i === 0
                    ? [a, b]
                    : [b]
                return nodes
              }).map((code, i, arr) => (
                <span key={`${code}-${i}`}>
                  <span className="text-ink">{code}</span>
                  {i < arr.length - 1 && <span className="text-amber"> → </span>}
                </span>
              ))}
            </span>
          </div>
        </div>
      </div>

      {/* bottom status strip */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 border-t border-border bg-surface/40 font-mono text-[10px] text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <Plane className="w-3 h-3 text-amber" />
          <span>
            route{' '}
            <span className="text-ink">BKK → MAD → NYC → LAX</span>
          </span>
        </span>
        <span className="text-ink-soft/60">·</span>
        <span>
          est.<span className="text-ink"> 28h 40m</span>
        </span>
        <span className="text-ink-soft/60">·</span>
        <span>
          alt.<span className="text-ink"> 35,000ft</span>
        </span>
        <span className="text-ink-soft/60 hidden md:inline">·</span>
        <span className="hidden md:inline">
          wx.<span className="text-ink"> 28°C · partly cloudy</span>
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-electric" />
          <span className="tabular-nums text-ink">06:20</span>
          <span className="text-ink-soft/60">·</span>
          <span>gate <span className="text-ink">B8</span></span>
        </span>
      </div>
    </motion.div>
  )
}

// ============================================================
// BoardingPassCard — workspace as a boarding pass
// ============================================================

function BoardingPassCard({
  ws,
  index,
}: {
  ws: Workspace
  index: number
}) {
  const Icon = ws.icon
  const cls = ACCENT_CLS[ws.accent]
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      onMouseEnter={() => trackEvent('Nomad Life', 'Workspace View', ws.title)}
      className="group relative rounded-xl border border-border bg-background overflow-hidden shadow-[0_16px_40px_-22px_hsl(var(--ink)/0.25)] hover:shadow-[0_28px_60px_-25px_hsl(var(--accent)/0.35)] hover:border-ink/30 transition-all"
    >
      {/* animated top gradient */}
      <span
        aria-hidden
        className={`absolute top-0 left-0 right-0 h-[2px] ${cls.bar} scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-700`}
      />

      {/* top — flight info strip */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-dashed border-border bg-surface/40 font-mono text-[10px] tracking-[0.22em] uppercase text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <Plane className={`w-3 h-3 ${cls.text} -rotate-[18deg]`} />
          <span className="text-ink tracking-wider">{ws.flight}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 text-lime">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-lime opacity-75 animate-ping" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
          </span>
          <span className="tabular-nums">0{index + 1}</span>
        </span>
      </div>

      {/* image area */}
      <div className="relative aspect-[4/3] overflow-hidden bg-surface">
        <img
          src={ws.image}
          alt={ws.title}
          loading="lazy"
          width={400}
          height={300}
          className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-scanlines opacity-[0.14] mix-blend-multiply pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent"
        />
        <HudCorners color="text-lime" />
        <div className="absolute top-3 right-3">
          <span
            className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-background/90 backdrop-blur border border-border ${cls.text}`}
          >
            <Icon className="w-4 h-4" />
          </span>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: -18 }}
          whileInView={{ opacity: 1, scale: 1, rotate: -8 }}
          viewport={{ once: true }}
          transition={{
            delay: 0.3 + index * 0.08,
            duration: 0.5,
            type: 'spring',
            stiffness: 220,
          }}
          className="absolute top-3 left-3"
        >
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded border-2 border-amber/80 bg-amber/10 backdrop-blur text-amber font-mono text-[9px] tracking-[0.22em] uppercase font-bold">
            departed
          </span>
        </motion.div>
      </div>

      {/* dashed perforation */}
      <div aria-hidden className="border-t border-dashed border-border" />

      {/* from → to */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3 border-b border-border">
        <div>
          <div className="font-mono text-[9px] tracking-[0.22em] uppercase text-ink-soft">
            from
          </div>
          <div className="font-display text-xl font-bold tracking-tight text-ink">
            {ws.from}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Plane className={`w-4 h-4 ${cls.text} rotate-90`} />
          <span className="h-px w-10 bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>
        <div className="text-right">
          <div className="font-mono text-[9px] tracking-[0.22em] uppercase text-ink-soft">
            to
          </div>
          <div className={`font-display text-xl font-bold tracking-tight ${cls.text}`}>
            {ws.to}
          </div>
        </div>
      </div>

      {/* content */}
      <div className="px-4 py-4">
        <h3 className="font-display text-lg font-bold tracking-tight text-ink mb-1">
          {ws.title}
        </h3>
        <div className="flex items-center gap-1.5 text-[11px] text-ink-soft font-mono mb-2.5">
          <MapPin className="w-3 h-3" />
          <span>{ws.location}</span>
        </div>
        <p className="text-[12.5px] text-ink-muted leading-relaxed">
          {ws.description}
        </p>
      </div>

      {/* bottom — seat / gate */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-t border-dashed border-border bg-surface/40 font-mono text-[10px] tracking-[0.22em] uppercase text-ink-soft">
        <span>
          seat <span className="text-ink">{ws.seat}</span>
        </span>
        <span className="text-ink-soft/60">·</span>
        <span>
          gate <span className="text-ink">{ws.gate}</span>
        </span>
        <span className="ml-auto inline-flex items-center gap-1">
          <span className={`w-1 h-1 rounded-full ${cls.dot}`} />
          <span className="text-ink">ok</span>
        </span>
      </div>
    </motion.div>
  )
}

// ============================================================
// DeparturesBoard — dark airport-board stats
// ============================================================

function DeparturesBoard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6 }}
      className="relative rounded-2xl border border-ink/60 bg-ink overflow-hidden shadow-[0_30px_80px_-40px_hsl(var(--ink)/0.6)]"
    >
      <div className="flex items-center gap-3 px-4 py-2 border-b border-white/10 bg-ink font-mono text-[10px] tracking-[0.22em] uppercase text-white/55">
        <span className="inline-flex items-center gap-1.5 text-amber">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-amber opacity-75 animate-ping" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber" />
          </span>
          live
        </span>
        <span className="text-white/70">terminal.board · yap-international</span>
        <span className="ml-auto text-white/35 hidden sm:inline">
          sync · now
        </span>
      </div>

      <div
        aria-hidden
        className="absolute inset-0 bg-scanlines opacity-[0.08] mix-blend-screen pointer-events-none"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
        {lifestyleStats.map((stat, i) => {
          const cls = ACCENT_CLS[stat.accent]
          return (
            <div
              key={stat.label}
              className="relative px-5 md:px-6 py-7 md:py-9 text-white overflow-hidden"
              onMouseEnter={() =>
                trackEvent('Nomad Life', 'Stat View', stat.label)
              }
            >
              <div className="flex items-start justify-between mb-4">
                <span
                  className={`font-mono text-[9px] tracking-[0.24em] uppercase ${cls.text}`}
                >
                  {stat.sublabel}
                </span>
                <span className="font-mono text-[9px] tabular-nums text-white/35">
                  0{i + 1}
                </span>
              </div>

              <div
                className={`relative font-display text-4xl md:text-5xl font-bold tracking-tighter ${cls.text}`}
              >
                <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                <span
                  aria-hidden
                  className="absolute inset-0 blur-[14px] opacity-50 pointer-events-none"
                >
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                </span>
              </div>

              <div className="mt-3 text-[11px] text-white/60 font-mono tracking-wide leading-snug">
                {stat.label}
              </div>

              <motion.span
                aria-hidden
                className={`absolute bottom-0 left-0 h-[2px] ${cls.bar}`}
                initial={{ width: 0 }}
                whileInView={{ width: '100%' }}
                viewport={{ once: true }}
                transition={{
                  duration: 1.4,
                  delay: 0.3 + i * 0.12,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3 px-4 py-2 border-t border-white/10 font-mono text-[9.5px] tracking-[0.22em] uppercase text-white/40">
        <span>board.rev</span>
        <span className="text-white/75 tabular-nums">
          v2.{new Date().getFullYear()}
        </span>
        <span className="text-white/25">·</span>
        <span>data · verified</span>
        <span className="ml-auto text-white/25">// logged by felix.dev</span>
      </div>
    </motion.div>
  )
}

// ============================================================
// LiveTicker
// ============================================================

function LiveTicker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS]
  return (
    <div className="relative flex items-stretch rounded-full border border-border bg-surface/40 backdrop-blur overflow-hidden">
      <div className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 bg-ink text-background font-mono text-[10px] tracking-[0.24em] uppercase rounded-l-full">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75 animate-ping" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-destructive" />
        </span>
        live
      </div>

      <div className="relative flex-1 overflow-hidden">
        <div
          aria-hidden
          className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"
        />
        <div className="flex items-center gap-7 py-2 pl-4 whitespace-nowrap animate-scroll-x">
          {items.map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-2 font-mono text-[11px] text-ink-muted"
            >
              <span className="text-accent">●</span>
              <span>{item}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 bg-surface/60 text-ink-soft font-mono text-[10px] tracking-[0.24em] uppercase rounded-r-full border-l border-border">
        <Plane className="w-3 h-3 text-amber -rotate-[18deg]" />
        feed
      </div>
    </div>
  )
}

// ============================================================
// HudCorners
// ============================================================

function HudCorners({ color = 'text-lime' }: { color?: string }) {
  const brackets: Array<{ className: string; d: string }> = [
    { className: 'top-2 left-2', d: 'M 2 12 L 2 2 L 12 2' },
    { className: 'top-2 right-2', d: 'M 4 2 L 14 2 L 14 12' },
    { className: 'bottom-2 left-2', d: 'M 2 4 L 2 14 L 12 14' },
    { className: 'bottom-2 right-2', d: 'M 4 14 L 14 14 L 14 4' },
  ]
  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
    >
      {brackets.map((b, i) => (
        <svg
          key={i}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          className={`absolute ${b.className} ${color}`}
        >
          <path
            d={b.d}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      ))}
    </div>
  )
}
