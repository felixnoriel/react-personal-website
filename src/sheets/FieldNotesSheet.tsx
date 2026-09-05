import { Link } from 'react-router'
import { Picture } from '../components/Picture'
import { IMAGES as siteImages } from '../data/images/site.generated'
import { LiveClock } from '../components/ui/LiveClock'
import { useData } from '../contexts/DataContext'
import { decodeEntities } from '../components/blog/decode'
import { CITIES, formatCoord } from '../utils/plot'
import { formatDate } from '../utils/date'
import { ArrowMark } from '../marks'
import { CityPlot } from './CityPlot'
import './field-notes.css'

/**
 * Sheet 5 - field notes.
 *
 * The one sheet in the set that is written in a different hand. The content
 * here is warm and funny - 1000+ cafes, 500+ dishes, merge conflicts meeting
 * turbulence - and setting it as a cold gazetteer would put the drawing's
 * voice at war with it. So the photograph opens the sheet at real size, the
 * four counts are set at the same scale as the hero's metrics, and the plot
 * of the fifteen cities is sketched rather than ruled.
 *
 * Everything on it is still: no reveals, no counters, no ticking seconds.
 * The clock is the shared LiveClock, which prints --:-- into the static HTML
 * and fills in after the page takes over.
 */

/** verbatim from the nomad section */
const STATS: { figure: string; label: string }[] = [
  { figure: '15+', label: 'Countries coded from' },
  { figure: '5+', label: 'Years as a nomad' },
  { figure: '1000+', label: 'Cafés explored' },
  { figure: '500+', label: 'Local dishes tried' },
]

/** the four places, verbatim, with the image URLs the build manifest knows */
const PLACES: { image: string; title: string; location: string; description: string }[] = [
  {
    image:
      'https://images.unsplash.com/photo-1649061267116-bf9d813b3757?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwbm9tYWQlMjBsYXB0b3AlMjBjYWZlfGVufDF8fHx8MTc2NTMyNTcwNHww&ixlib=rb-4.1.0&q=80&w=1600',
    title: 'Café coding',
    location: 'Tokyo, Japan',
    description: 'Best matcha lattes while debugging',
  },
  {
    image:
      'https://images.unsplash.com/photo-1609765685592-703a97c877ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhaXJwbGFuZSUyMHdpbmRvdyUyMHRyYXZlbHxlbnwxfHx8fDE3NjUzMDE2MTF8MA&ixlib=rb-4.1.0&q=80&w=1600',
    title: 'Cloud office',
    location: '35,000 ft',
    description: 'Where merge conflicts meet turbulence',
  },
  {
    image:
      'https://images.unsplash.com/photo-1652793822328-47340b1b4407?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwd2Fsa2luZyUyMHN0cmVldHxlbnwxfHx8fDE3NjUzMjU3MDR8MA&ixlib=rb-4.1.0&q=80&w=1600',
    title: 'City explorer',
    location: 'Street markets',
    description: 'Best ideas come while walking',
  },
  {
    image:
      'https://images.unsplash.com/photo-1758767055219-35755e2d76bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJlZXQlMjBmb29kJTIwY3VsdHVyZXxlbnwxfHx8fDE3NjUzMjU3MDR8MA&ixlib=rb-4.1.0&q=80&w=1600',
    title: 'Food adventures',
    location: 'Everywhere',
    description: 'Trying local cuisines between commits',
  },
]

const HOME = CITIES.find((c) => c.current) ?? CITIES[1]

export function FieldNotesSheet() {
  const { blog } = useData()
  const recent = [...blog]
    .sort((a, b) => (a.publishedDate < b.publishedDate ? 1 : -1))
    .slice(0, 4)
  const opener = PLACES[0]

  return (
    <section
      id="sheet-field-notes"
      className="section cv-auto field-notes"
      aria-labelledby="sheet-field-notes-title"
    >
      <figure className="fn-photo">
        <div className="plate">
          <Picture src={opener.image} from={siteImages} alt={`${opener.title} · ${opener.location}`} sizes="100vw" />
        </div>
        <figcaption className="plate__caption fn-caption">
          <span className="fn-caption__title">{opener.title}</span>
          <span className="meta meta--pen">{opener.location}</span>
          <span className="meta">{opener.description}</span>
        </figcaption>
      </figure>

      <div className="section__head">
        <h2 id="sheet-field-notes-title">Nomading across Asia with the fam and a laptop.</h2>
        <p className="meta meta--label fn-clock">
          Bangkok · <LiveClock timezone="UTC" /> UTC
        </p>
      </div>
      <p className="section__intro">
        Based in Asia and moving between cities with family in tow — building products between flights, markets, and
        good coffee.
      </p>

      <div className="cols fn-cols">
        <div className="cols__main">
          <div className="fn-plotrow">
            <CityPlot />
            <div className="fn-list">
              <ul className="fn-cities">
                {CITIES.map((c) => (
                  <li className="fn-city" key={c.code}>
                    <span className="fn-city__name">
                      {c.current && <span className="sq" aria-hidden="true" />}
                      {c.name}
                    </span>
                    <span className="meta meta--pen fn-city__coord">{formatCoord(c.lat, c.lng)}</span>
                  </li>
                ))}
              </ul>
              <p className="meta fn-here">{`you are here · ${HOME.name}`}</p>
            </div>
          </div>
        </div>
        <p className="cols__side sidenote meta fn-sidenote">{formatCoord(HOME.lat, HOME.lng)} · TH</p>
      </div>

      <div className="fn-stats">
        {STATS.map((s) => (
          <div className="callout" key={s.label}>
            <span className="figure callout__figure">{s.figure}</span>
            <span className="callout__label">{s.label}</span>
          </div>
        ))}
      </div>

      <ul className="fn-places">
        {PLACES.map((p) => (
          <li key={p.title}>
            <div className="plate">
              <Picture
                src={p.image}
                from={siteImages}
                alt={`${p.title} · ${p.location}`}
                sizes="(min-width: 900px) 25vw, 45vw"
              />
            </div>
            <div className="plate__caption fn-caption">
              <span className="fn-caption__title">{p.title}</span>
              <span className="meta meta--pen">{p.location}</span>
              <span className="meta">{p.description}</span>
            </div>
          </li>
        ))}
      </ul>

      <div className="fn-writing" id="field-notes-writing">
        <h3>Field notes from the road.</h3>
        <p className="section__intro">
          Dispatches from the places I&apos;ve worked from, the teams I&apos;ve shipped with, and the roads in between.
        </p>

        <ul className="fn-index">
          {recent.map((post) => (
            <li key={post.slug}>
              <Link className="index-row fn-row" to={`/blog/${post.slug}`}>
                <span className="meta meta--pen fn-row__date">{formatDate(post.publishedDate, 'yyyy-MM-dd')}</span>
                <span className="fn-row__mid">
                  <span className="fn-row__title">{decodeEntities(post.title)}</span>
                  <span className="leader" aria-hidden="true" />
                </span>
                {post.tags[0] && <span className="meta fn-row__tag">{post.tags[0].name}</span>}
              </Link>
            </li>
          ))}
        </ul>

        <p className="fn-more">
          <Link className="link fn-more__link" to="/blog">
            {`The archive · ${blog.length} dispatches`}
            <ArrowMark size={14} />
          </Link>
        </p>
      </div>
    </section>
  )
}
