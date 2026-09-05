import './about-website.css'

// ==========================================================================
// /about - an index sheet, not a page of cards.
//
// The two lines of copy are the ones that have always been here, emoji and
// all. What changed is the "About this website" list underneath: it still
// claimed WordPress and Tailwind, neither of which this site runs on any
// more, so it is set as a small bill of materials of the parts actually in
// the build - the same row format as the parts list on the home sheet.
// ==========================================================================

/** The real stack, in build order. Item numbers are a position in this list. */
const PARTS = [
  'React 19',
  'Vite 8 (Rolldown)',
  'react-router 8',
  'TypeScript',
  'prerendered static HTML at build time',
  'two self-hosted OFL typefaces',
  'Vercel',
]

export function AboutWebsite() {
  return (
    <section className="section about" aria-labelledby="about-title">
      <h1 id="about-title" className="about__title">
        About Me
      </h1>

      <div className="about__lead">
        <p>I'm a Product Engineer based in Asia, digital nomading with the fam 🌏</p>
        <p>
          When I'm not in front of my computer, I like to cook, trying out different restaurants and
          cuisines, and traveling every once in a while. 🍜
        </p>
      </div>

      <div className="cols about__site">
        <div className="cols__main">
          <h2 className="about__site-title">About this website</h2>
          <ol className="about__parts">
            {PARTS.map((part) => (
              <li className="about__part" key={part}>
                <span className="about__part-name">{part}</span>
              </li>
            ))}
          </ol>
          <p className="meta about__credit">Developed with ❤️ by Felix Noriel</p>
        </div>
      </div>
    </section>
  )
}
