/**
 * NOMAD — the static markup (rendered at build time, so every word, number
 * and image is real HTML at first paint).
 *
 * The overlay layer at the top is the HUD that rides the globe: a pin per
 * city, three flight threads and their aircraft. It is position: fixed and
 * empty of flow, so it can never move a pixel of the page; nomad.ts only
 * shows it once the GPU tier is actually rendering frames. Everything the
 * overlay says is repeated in the flow below (the city index, the manifest),
 * so keyboards, screen readers and the CSS tier lose nothing.
 */
import { CITY_LIST, ACTIVE_EDGES, NOMAD_STATS, PLACES, ROUTE_EDGES, SECTIONS } from '../../shared/content'

/** IANA zone + country for each city, in CITY_LIST order. Facts, not copy. */
const META: Record<string, [string, string]> = {
  BKK: ['Asia/Bangkok', 'Thailand'],
  MNL: ['Asia/Manila', 'Philippines'],
  HKG: ['Asia/Hong_Kong', 'Hong Kong SAR'],
  TPE: ['Asia/Taipei', 'Taiwan'],
  SEL: ['Asia/Seoul', 'South Korea'],
  TYO: ['Asia/Tokyo', 'Japan'],
  SIN: ['Asia/Singapore', 'Singapore'],
  BLI: ['Asia/Makassar', 'Indonesia'],
  SYD: ['Australia/Sydney', 'Australia'],
  NYC: ['America/New_York', 'United States'],
  LAX: ['America/Los_Angeles', 'United States'],
  YYZ: ['America/Toronto', 'Canada'],
  MAD: ['Europe/Madrid', 'Spain'],
  BLQ: ['Europe/Rome', 'Italy'],
  MUC: ['Europe/Berlin', 'Germany'],
}

/** great-circle distance in km, mean Earth radius — the same maths the arcs use */
function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const r = Math.PI / 180
  const x =
    Math.sin(a.lat * r) * Math.sin(b.lat * r) +
    Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.cos((a.lng - b.lng) * r)
  return Math.round(6371 * Math.acos(Math.max(-1, Math.min(1, x))))
}
const group = (v: number) => v.toLocaleString('en-US')
const geo = (c: { lat: number; lng: number }) =>
  `${Math.abs(c.lat).toFixed(2)}°${c.lat < 0 ? 'S' : 'N'} ${Math.abs(c.lng).toFixed(2)}°${c.lng < 0 ? 'W' : 'E'}`

const HOME = CITY_LIST.find((c) => c.current) ?? CITY_LIST[0]
const idx = (code: string) => CITY_LIST.findIndex((c) => c.code === code)

export function render(): string {
  const c = SECTIONS.nomad

  /* the HUD that rides the sculpture — decorative, mirrored in the flow below */
  const pins = CITY_LIST.map((city, i) => {
    const home = city.current === true
    return `<span class="pin${home ? ' home' : ''}" data-i="${i}"><i class="pip"></i><span class="tag"><b>${city.code}</b><em>${city.name}</em>${
      home ? `<u class="mono" data-home-clock>--:--</u>` : ''
    }</span></span>`
  }).join('')

  const jets = ACTIVE_EDGES.map(
    ([a, b], i) =>
      `<span class="jet" data-e="${i}"><i class="dotj"></i><span class="jt mono">${a}<i>→</i>${b}</span></span>`,
  ).join('')

  const threads = ACTIVE_EDGES.map(
    (_, i) => `<g class="lane" data-e="${i}"><path class="glow" /><path class="core" /></g>`,
  ).join('')

  /* the flight manifest: the three legs currently in the air */
  const manifest = ACTIVE_EDGES.map(([a, b], i) => {
    const ca = CITY_LIST[idx(a)]
    const cb = CITY_LIST[idx(b)]
    return `<li data-e="${i}" data-a="${idx(a)}" data-b="${idx(b)}">
              <b>${a}</b><i class="arw" aria-hidden="true">→</i><b>${b}</b>
              <span class="track"><i class="bar"></i></span>
              <span class="km mono">${group(km(ca, cb))} km</span>
            </li>`
  }).join('')

  /* the fifteen cities, the accessible twin of the pins on the globe */
  const cities = CITY_LIST.map((city, i) => {
    const [tz, country] = META[city.code] ?? ['UTC', '']
    return `<li><button type="button" class="ct${city.current ? ' now' : ''}" data-i="${i}" data-code="${city.code}"
              data-name="${city.name}" data-country="${country}" data-tz="${tz}" data-geo="${geo(city)}"
              data-km="${city.current ? '' : group(km(HOME, city)) + ' km'}" aria-pressed="false"><b>${city.code}</b><span>${city.name}</span></button></li>`
  }).join('')

  /* every leg he actually flew — hovering one traces it on the globe */
  const flown = ROUTE_EDGES.map(([a, b], i) => {
    const ca = CITY_LIST[idx(a)]
    const cb = CITY_LIST[idx(b)]
    return `<li class="lg" data-r="${i}" data-a="${idx(a)}" data-b="${idx(b)}" title="${ca.name} to ${cb.name}, ${group(km(ca, cb))} km">${a}<i aria-hidden="true">→</i>${b}</li>`
  }).join('')

  const stats = NOMAD_STATS.map(
    (s) => `<div class="stat glass">
              <dd data-n="${s.value}" data-suffix="${s.suffix}">${s.value}${s.suffix}</dd>
              <dt>${s.label}</dt>
              <span class="note mono">${s.sub}</span>
            </div>`,
  ).join('')

  const places = PLACES.map(
    (p, i) => `<li><figure class="card" data-p="${i}">
                 <img src="${p.image}" alt="${p.title} — ${p.location}" width="640" height="480" loading="lazy" decoding="async" />
                 <figcaption>
                   <b>${p.title}</b>
                   <span class="mono where">${p.location}</span>
                   <span class="desc">${p.description}</span>
                 </figcaption>
               </figure></li>`,
  ).join('')

  return `
      <section class="chapter right nomad" id="nomad" data-shape="5" aria-labelledby="nomad-title">
        <div class="nmd-hud" aria-hidden="true" data-hud>
          <svg class="threads" data-threads>${threads}<g class="lane hov" data-hov><path class="glow" /><path class="core" /></g></svg>
          <div class="pins" data-pins>${pins}</div>
          <div class="jets" data-jets>${jets}</div>
        </div>

        <div class="inner">
          <span class="kicker mono rev">${c.index} — ${c.eyebrow}</span>
          <h2 class="rev" id="nomad-title">${c.title}</h2>
          <p class="rev">${c.intro}</p>

          <div class="nmd-now glass rev" data-now>
            <div class="cap mono"><span data-state>you are here</span><span class="live"><i class="dot"></i>live</span></div>
            <p class="who"><b data-code>${HOME.code}</b> <span data-name>${HOME.name}</span><i class="mono" data-country>${META[HOME.code][1]}</i></p>
            <dl class="read mono">
              <div><dt>local time</dt><dd data-time>--:--:--</dd></div>
              <div><dt>coordinates</dt><dd data-geo>${geo(HOME)}</dd></div>
              <div><dt>from bangkok</dt><dd data-km>home base</dd></div>
            </dl>
          </div>

          <dl class="nmd-stats rev">${stats}</dl>

          <div class="nmd-legs rev">
            <div class="cap mono"><span>in flight</span><span>${ACTIVE_EDGES.length} active routes</span></div>
            <ul data-legs>${manifest}</ul>
          </div>

          <div class="nmd-map rev">
            <div class="cap mono"><span>the map</span><span>${CITY_LIST.length} cities · drag the globe to spin it</span></div>
            <ul class="cities" data-cities>${cities}</ul>
            <ul class="flown" data-flown>${flown}</ul>
          </div>

          <div class="nmd-places rev">
            <div class="cap mono"><span>from the road</span><span>${PLACES.length} frames</span></div>
            <ul data-places>${places}</ul>
          </div>
        </div>
      </section>`
}
