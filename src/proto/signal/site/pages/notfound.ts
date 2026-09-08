/**
 * /404/ — the page that is not in this signal.
 *
 * One screen, shape 7: the core is already a transmitter here, so the copy
 * simply says the address is not on this frequency and points at everything
 * that is. noindex, because a 404 must never be a search result.
 *
 * The address the visitor actually asked for is written in by
 * sections/pages-about.ts at runtime (the static file cannot know it), and
 * the markup reserves the line so nothing moves when it lands.
 */
import type { PageSpec } from '../layout'

const LINKS: { label: string; meta: string; href: string }[] = [
  { label: 'The front page', meta: 'the core, the numbers, the bio', href: '/' },
  { label: 'Selected work', meta: 'nine products, three with numbers', href: '/projects/' },
  { label: 'Career', meta: 'nine roles, 2013 → now', href: '/career/' },
  { label: 'Writing', meta: 'eighteen posts from the road', href: '/blog/' },
  { label: 'About', meta: 'him, and how this site is built', href: '/about/' },
]

/**
 * The page's own behaviour, loaded from the head so nothing shared has to
 * know these two routes exist. The <noscript> rule matters: the reveal class
 * starts at opacity 0 and JavaScript adds the class that brings it in, so
 * without this the page would be blank for a reader with no script.
 */
const HEAD =
  `<noscript><style>.rev{opacity:1!important;transform:none!important}.ab-pose-in{opacity:1!important;transform:none!important}</style></noscript>`

export function notFoundPages(): PageSpec[] {
  return [
    {
      path: '/404/',
      title: 'Not in this signal',
      description: 'That address is not part of this site. Here is everything that is.',
      shape: 7,
      noindex: true,
      css: ['pages-about'],
      head: HEAD,
      main: `
      <section class="chapter nf" aria-labelledby="nf-title">
        <div class="inner">
          <span class="kicker mono rev">404 · no carrier</span>
          <h1 class="rev" id="nf-title"><span class="ink">Not in this signal.</span></h1>
          <p class="nf-lead rev">
            Nothing is broken and nothing is lost — this address just isn't part of the transmission. It may have
            moved, or it may never have existed.
          </p>
          <p class="nf-addr mono rev">
            <span class="nf-k">requested</span>
            <span class="nf-path" id="nf-path">this address</span>
            <span class="nf-x" aria-hidden="true">✕</span>
          </p>
          <nav class="nf-links rev" aria-label="Everything that is on this site">
            <ul>${LINKS.map(
              (l) => `
              <li>
                <a href="${l.href}">
                  <span class="nf-a mono" aria-hidden="true">›</span>
                  <b>${l.label}</b>
                  <em>${l.meta}</em>
                  <i class="nf-go mono" aria-hidden="true">→</i>
                </a>
              </li>`,
            ).join('')}
            </ul>
          </nav>
          <div class="ctas endcard rev">
            <a class="cta solid" href="/" id="nf-home">Take me home <span class="arw" aria-hidden="true">→</span></a>
            <button type="button" class="cta ghost glass" commandfor="con" command="show-modal">
              Search everything <span class="arw" aria-hidden="true">⌘K</span>
            </button>
          </div>
        </div>
        <div class="ab-pins" id="nf-pins" aria-hidden="true"></div>
      </section>`,
    },
  ]
}
