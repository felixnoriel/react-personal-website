import { CITIES, buildPlot } from '../utils/plot'

/**
 * The fifteen cities, plotted.
 *
 * Not a map widget: real longitude and latitude fitted to the data's own
 * bounding box, drawn as ink dots inside a frame sketched by hand rather
 * than ruled. Bangkok is the one dot in red pencil, circled the way you
 * would circle where you are. The names are set beside their dots by hand,
 * one offset per city, because nine of the fifteen sit in one cluster and
 * no automatic placement survives that.
 *
 * The box is 356x256 and the SVG never renders wider than that, so the type
 * inside it lands between 11px and 12.3px on every screen - never smaller.
 *
 * It is decorative here in the accessibility sense only: every city name and
 * coordinate in it is also set as real text in the list beside it, so the
 * plot is hidden from screen readers instead of read out twice.
 */

const W = 356
const H = 236
/** the strip under the frame that carries the longitude label */
const FOOT = 20

type Anchor = 'start' | 'middle' | 'end'

/** hand-set label positions: one per city, in plot units, relative to the dot */
const LABELS: Record<string, { dx: number; dy: number; anchor: Anchor }> = {
  LAX: { dx: -8, dy: 15, anchor: 'start' },
  YYZ: { dx: -5, dy: -5, anchor: 'end' },
  NYC: { dx: 6, dy: 12, anchor: 'start' },
  MAD: { dx: 6, dy: 13, anchor: 'start' },
  BLQ: { dx: -6, dy: 3, anchor: 'end' },
  MUC: { dx: 6, dy: 4, anchor: 'start' },
  SEL: { dx: -6, dy: 4, anchor: 'end' },
  TYO: { dx: 6, dy: 4, anchor: 'start' },
  TPE: { dx: 6, dy: 4, anchor: 'start' },
  HKG: { dx: -6, dy: 4, anchor: 'end' },
  MNL: { dx: 6, dy: 4, anchor: 'start' },
  BKK: { dx: -14, dy: 4, anchor: 'end' },
  SIN: { dx: 7, dy: 4, anchor: 'start' },
  BLI: { dx: 6, dy: 4, anchor: 'start' },
  SYD: { dx: -6, dy: 4, anchor: 'end' },
}
const DEFAULT_LABEL = { dx: 6, dy: 4, anchor: 'start' as Anchor }

/* The frame. Four strokes that miss their corners slightly and a short
   overshoot past the last one, which is what a pencil does. Fixed geometry,
   never generated, so the build and the browser draw the same box. */
const FRAME =
  'M4.5 5.2C70 2.4 180 6.1 350.5 3.6' +
  'C353.8 70 351.4 150 353.2 231.4' +
  'C250 234.6 120 231.8 5.8 233.9' +
  'C2.6 160 5.4 80 3.2 4.4' +
  'L12.4 5.6'

/* The ring around Bangkok: one open, slightly out-of-round pencil circle. */
const HERE_RING =
  'M269.4 92.6C275.6 92.6 279.1 96.8 278.9 102.6' +
  'C278.7 108.6 274.6 112.4 268.6 112' +
  'C262.8 111.6 259.4 107.6 259.9 101.8' +
  'C260.4 96.3 263.9 93.3 270.8 92.2'

export function CityPlot() {
  const plot = buildPlot(CITIES, W, H, 0.09)
  const lngs = CITIES.map((c) => c.lng)
  const lats = CITIES.map((c) => c.lat)
  const west = `${Math.round(Math.abs(Math.min(...lngs)))}°W`
  const east = `${Math.round(Math.max(...lngs))}°E`
  const south = `${Math.round(Math.abs(Math.min(...lats)))}°S`
  const north = `${Math.round(Math.max(...lats))}°N`

  return (
    <svg
      className="plot"
      viewBox={`0 0 ${W} ${H + FOOT}`}
      width={W}
      height={H + FOOT}
      aria-hidden="true"
      focusable="false"
    >
      <path className="plot__frame" d={FRAME} />

      {/* the two axis labels: the real span the fifteen cities cover */}
      <text className="plot__axis" x="14" y="224">
        {west} → {east}
      </text>
      <text className="plot__axis" x="16" y="206" transform="rotate(-90 16 206)">
        {south} → {north}
      </text>

      <path className="plot__ring" d={HERE_RING} />

      {plot.points.map((p) => {
        const l = LABELS[p.code] ?? DEFAULT_LABEL
        return (
          <g key={p.code} className={p.current ? 'plot__city plot__city--here' : 'plot__city'}>
            <circle className="plot__dot" cx={p.x} cy={p.y} r={p.current ? 3.3 : 2.2} />
            <text className="plot__name" x={p.x + l.dx} y={p.y + l.dy} textAnchor={l.anchor}>
              {p.name}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
