import { Link } from 'react-router'
import { SEOHead } from '../components/seo/SEOHead'

/**
 * The sheet that is not in the set. Prerendered at /404 and served by Vercel
 * as its custom 404 page; the client-side catch-all route renders the same
 * markup, so an unknown URL never hydrates against the wrong page.
 */
export function NotFound() {
  return (
    <>
      <SEOHead title="Not found" description="There is no sheet at this address." url="/404" noindex />
      <section className="section" id="sheet-404">
        <div className="section__head">
          <h1>Not in this set.</h1>
        </div>
        <p className="section__intro">There is no sheet at this address. The drawing set starts on the home page.</p>
        <p>
          <Link className="link" to="/">
            Back to the first sheet
          </Link>
        </p>
      </section>
    </>
  )
}
