import './hero.css'

/**
 * Sheet 1 - the hero.
 *
 * Seven rows read straight down the datum: status, the headline, the key
 * line, the bio, the two calls to action, the four production numbers, the
 * tech key. Columns 9-12 are bare paper.
 *
 * The <h1> is the LCP element by construction: plain text, no photo, no
 * canvas, no boot screen. There is no JavaScript in this sheet at all - no
 * state, no effects, no counters - so the prerendered HTML is the finished
 * article and the page is completely still once it paints.
 */

/** The four real production numbers. Every string here is verbatim content. */
const METRICS = [
  { figure: '7.5M+', label: 'messages / day', sub: 'event pipeline → BigQuery' },
  { figure: '150k', label: 'monthly actives', sub: 'Genopets · Web3 gaming' },
  { figure: '80%', label: 'faster p95', sub: 'latency optimization' },
  { figure: '1.8M+', label: 'users reached', sub: 'notification system' },
]

/** The bio, three sentences, one <p> each. Verbatim. */
const BIO = [
  "I'm Felix — a senior full-stack engineer and technical co-founder.",
  '13+ years shipping software for startups across Web3, fintech, hospitality, and media.',
  'Currently based in Asia and digital nomading with the fam.',
]

/** The tech key, in order. Verbatim. */
const TECH = [
  'TypeScript',
  'React',
  'React Native',
  'Node.js',
  'Next.js',
  'Golang',
  'Rust',
  'PostgreSQL',
  'Solana',
  'AWS',
  'GCP',
  'GraphQL',
  'Python',
  'Redis',
  'EVM',
  'Datadog',
]

export function HeroSheet() {
  return (
    <section id="sheet-hero" className="hero" aria-labelledby="sheet-hero-title">
      {/* Row A - status. A solid square, not a pulsing dot. */}
      <p className="hero__status">
        <span className="sq" aria-hidden="true" />
        <span className="meta meta--label">available for work</span>
        {/* the hairline and the location travel together, so a wrap on a
            narrow phone puts the mark at the head of the second line rather
            than leaving it dangling at the end of the first */}
        <span className="hero__where">
          <span className="hero__hair" aria-hidden="true" />
          <span className="meta meta--label">Bangkok · UTC+7 · remote-friendly</span>
        </span>
      </p>

      <div className="cols">
        <div className="cols__main">
          {/* Row B - the headline, and the LCP element */}
          <h1 id="sheet-hero-title" className="hero__title" data-face="display">
            Product Engineer
          </h1>

          {/* Row C - the key line. Punctuation set in the drawing's own hand;
              it measures nothing. */}
          <p className="keyline hero__keyline">
            <span>Startups</span>
            <span>Web3</span>
            <span>Fintech</span>
          </p>

          {/* Row D - the bio. No typewriter, no reveal, no delay. */}
          <div className="hero__bio">
            {BIO.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>

          {/* Row E - the two calls to action */}
          <div className="hero__ctas">
            <a className="btn btn--solid" href="#sheet-work">
              See selected work
            </a>
            <a className="link hero__cta-link" href="#sheet-contact">
              Get in touch
            </a>
          </div>
        </div>
      </div>

      <div className="cols">
        <div className="hero__lower">
          {/* Row F - the four numbers. No rules under the figures: a message
              count, a user count and a percentage share no axis. */}
          <p className="meta meta--label hero__impact-label">impact · 2013 → now</p>
          <ul className="hero__metrics">
            {METRICS.map((m) => (
              <li className="callout" key={m.figure}>
                <span className="figure callout__figure">{m.figure}</span>
                <span className="callout__label">{m.label}</span>
                <span className="callout__sub">{m.sub}</span>
              </li>
            ))}
          </ul>

          {/* Row G - the tech key. Static: no marquee, no chips, no outlines. */}
          <p className="keyline hero__techkey">
            {TECH.map((name) => (
              <span key={name}>{name}</span>
            ))}
          </p>
        </div>
      </div>
    </section>
  )
}
