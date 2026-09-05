/**
 * The fifteen cities as bare dots on a hairline coordinate frame.
 *
 * Plotted from real longitude/latitude, then fitted to the data's own
 * bounding box (with padding) so the dots fill the frame instead of
 * clustering. No map outline, no projection library: it is the plot a
 * notebook would hold.
 */
export interface City {
  code: string
  name: string
  lng: number
  lat: number
  current?: boolean
}

export const CITIES: City[] = [
  { code: 'MNL', name: 'Manila', lng: 120.98, lat: 14.6 },
  { code: 'BKK', name: 'Bangkok', lng: 100.5, lat: 13.75, current: true },
  { code: 'HKG', name: 'Hong Kong', lng: 114.17, lat: 22.32 },
  { code: 'TPE', name: 'Taipei', lng: 121.5, lat: 25.05 },
  { code: 'SEL', name: 'Seoul', lng: 126.98, lat: 37.57 },
  { code: 'TYO', name: 'Tokyo', lng: 139.77, lat: 35.68 },
  { code: 'SIN', name: 'Singapore', lng: 103.82, lat: 1.35 },
  { code: 'BLI', name: 'Bali', lng: 115.21, lat: -8.5 },
  { code: 'SYD', name: 'Sydney', lng: 151.21, lat: -33.87 },
  { code: 'NYC', name: 'New York', lng: -74, lat: 40.71 },
  { code: 'LAX', name: 'Los Angeles', lng: -118.24, lat: 34.05 },
  { code: 'YYZ', name: 'Toronto', lng: -79.38, lat: 43.65 },
  { code: 'MAD', name: 'Madrid', lng: -3.7, lat: 40.42 },
  { code: 'BLQ', name: 'Bologna', lng: 11.34, lat: 44.49 },
  { code: 'MUC', name: 'Munich', lng: 11.58, lat: 48.14 },
]

export interface PlotPoint extends City {
  x: number
  y: number
}

export interface Plot {
  width: number
  height: number
  points: PlotPoint[]
  /** axis tick positions with their labels, e.g. { x: 12.3, label: '-120°' } */
  xTicks: { x: number; label: string }[]
  yTicks: { y: number; label: string }[]
}

export function buildPlot(cities: City[] = CITIES, width = 320, height = 200, pad = 0.08): Plot {
  const lngs = cities.map((c) => c.lng)
  const lats = cities.map((c) => c.lat)
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs)
  const minLat = Math.min(...lats), maxLat = Math.max(...lats)
  const spanLng = (maxLng - minLng) || 1
  const spanLat = (maxLat - minLat) || 1
  const x = (lng: number) => (pad + ((lng - minLng) / spanLng) * (1 - 2 * pad)) * width
  const y = (lat: number) => (pad + ((maxLat - lat) / spanLat) * (1 - 2 * pad)) * height
  const points = cities.map((c) => ({ ...c, x: round(x(c.lng)), y: round(y(c.lat)) }))
  const xTicks = [-120, -60, 0, 60, 120]
    .filter((v) => v >= minLng && v <= maxLng)
    .map((v) => ({ x: round(x(v)), label: `${v}°` }))
  const yTicks = [-30, 0, 30]
    .filter((v) => v >= minLat && v <= maxLat)
    .map((v) => ({ y: round(y(v)), label: `${v}°` }))
  return { width, height, points, xTicks, yTicks }
}

const round = (n: number) => Math.round(n * 10) / 10

/** 13.75°N · 100.50°E */
export function formatCoord(lat: number, lng: number): string {
  const la = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}`
  const lo = `${Math.abs(lng).toFixed(2)}°${lng >= 0 ? 'E' : 'W'}`
  return `${la} · ${lo}`
}
