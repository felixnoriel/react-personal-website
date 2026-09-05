import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { Signature } from '../marks/Signature'
import { LiveClock } from '../components/ui/LiveClock'
import { trackEmailClick, trackNavigation } from '../utils/analytics'
import './footer.css'

/**
 * The footer is the drawing's title block, and it is the one place the
 * conceit pays off completely: the cells sit around a signature and a
 * copyright line, which is what a title block is for.
 *
 * Every cell holds a fact that already exists in the content - no "drawn by",
 * no "scale", no sheet reference, no revision box.
 */

const EMAIL = 'norielfelixjr@gmail.com'
const SOCIALS = [
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/felixnoriel/' },
  { name: 'GitHub', url: 'https://github.com/felixnoriel' },
  { name: 'Facebook', url: 'https://www.facebook.com/felixnoriel' },
  { name: 'Instagram', url: 'https://www.instagram.com/felixnoriel/' },
]

/* Rendered on the server and in the first client paint, then replaced by the
   real year from an effect. Formatting a live date during render would bake
   the build's clock into forty static pages and mismatch on hydration. */
const BUILD_YEAR = 2026

const NAVIGATE = [
  { label: 'Home', href: '/' },
  { label: 'Work', href: '/projects' },
  { label: 'Experience', href: '/career' },
  { label: 'Skills', hash: 'sheet-parts' },
  { label: 'Writing', href: '/blog' },
] as const

export function TitleBlockFooter() {
  const { pathname } = useLocation()
  const onHome = pathname === '/'
  const [year, setYear] = useState(BUILD_YEAR)

  useEffect(() => {
    setYear(new Date().getFullYear())
  }, [])

  return (
    <footer id="sheet-footer" className="title-block">
      <p className="title-block__status">
        <span>&mdash; Let&apos;s build something</span>
        <span className="sq" aria-hidden="true" />
        <span>online &middot; accepting dms</span>
      </p>

      <h2 className="title-block__say">
        <a href={`mailto:${EMAIL}`} onClick={() => trackEmailClick('footer_hero')}>
          Have an idea? Say hello.
        </a>
      </h2>

      <div className="title-block__grid">
        <div className="tb-cell tb-cell--id">
          <p className="tb__name">Felix Noriel</p>
          <p className="tb__role">Product Engineer &middot; Asia</p>
        </div>

        <div className="tb-cell tb-cell--bio">
          <p className="tb__bio">
            Full-stack engineer and technical co-founder. Currently shipping at Stable on StablePay, and building
            Dashify on the side.
          </p>
        </div>

        <nav className="tb-cell tb-cell--nav" aria-labelledby="tb-navigate">
          <p className="tb__head" id="tb-navigate">
            Navigate
          </p>
          <ul className="tb__list">
            {NAVIGATE.map((item) => (
              <li key={item.label}>
                {'hash' in item ? (
                  <a
                    className="tb__link"
                    href={onHome ? `#${item.hash}` : `/#${item.hash}`}
                    onClick={() => trackNavigation(`/#${item.hash}`, 'footer_navigate')}
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    className="tb__link"
                    to={item.href}
                    onClick={() => trackNavigation(item.href, 'footer_navigate')}
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="tb-cell tb-cell--contact">
          <p className="tb__head">Contact</p>
          <ul className="tb__list">
            <li>
              <a className="tb__link" href={`mailto:${EMAIL}`} onClick={() => trackEmailClick('footer_contact')}>
                {EMAIL}
              </a>
            </li>
            <li className="tb__fact">Based in Asia &middot; nomading</li>
            <li className="tb__fact">Available for remote work</li>
            <li className="tb__socials">
              {SOCIALS.map((s, i) => (
                <span key={s.name}>
                  {i > 0 && <span aria-hidden="true"> &middot; </span>}
                  <a className="tb__link" href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.name}
                    <span className="visually-hidden">opens in a new tab</span>
                  </a>
                </span>
              ))}
            </li>
          </ul>
        </div>

        <div className="tb-cell tb-cell--sig">
          <Signature className="tb__sig" />
          <p className="tb__year">{year}</p>
        </div>
      </div>

      <div className="title-block__foot">
        <p className="tb__copy">&copy; {year} Felix Noriel &middot; MIT-licensed curiosity</p>
        <p className="tb__clock">
          UTC <LiveClock timezone="UTC" />
        </p>
      </div>
    </footer>
  )
}
