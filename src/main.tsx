import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Every route is prerendered to static HTML at build time by
// vite-prerender-plugin (see vite.config.ts). The HTML is real content, so the
// browser paints before React does anything; React then hydrates that markup
// instead of building it from scratch. In dev there is no prerendered markup,
// so we mount normally.
if (typeof window !== 'undefined') {
  // Hand the <head> back to React before it starts.
  //
  // The build writes each page's description, canonical and social tags into
  // <head> so crawlers and link previews see them without running any code.
  // React renders the very same tags, and it does not recognise the ones the
  // build put there — it adds its own alongside, then leaves the build's copies
  // behind, still describing the first page, after the reader clicks through to
  // a second one. Clearing them here leaves exactly one set, always current.
  // They have already done their job by this point: the browser read them while
  // parsing the page.
  document.querySelectorAll('head [data-prerender-head]').forEach((el) => el.remove())

  const target = document.getElementById('root')!
  const app = (
    <StrictMode>
      <App />
    </StrictMode>
  )
  if (import.meta.env.DEV) {
    createRoot(target).render(app)
  } else {
    hydrateRoot(target, app)
  }
}

// ---------------------------------------------------------------------------
// Build-time prerender entry (Node). Never runs in a browser.
// ---------------------------------------------------------------------------

const HTML_ENTITIES: Record<string, string> = {
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#x27;': "'",
  '&#39;': "'",
  '&amp;': '&',
}

/** Undo React's attribute/text escaping (the plugin re-escapes on its side). */
function decodeEntities(s: string): string {
  return s.replace(/&(?:lt|gt|quot|#x27|#39|amp);/g, (m) => HTML_ENTITIES[m] ?? m)
}

/**
 * React 19 hoists <title>/<meta>/<link> to the very front of the rendered
 * string. Peel them off so they can be placed in the document's real <head>
 * rather than left inside #root — otherwise the template's own <title> would
 * still win and every page would share one title.
 *
 * The tags are handed to the plugin as raw strings, which it emits verbatim.
 */
function splitHoistedHead(rendered: string) {
  const elements = new Set<string>()
  let title = ''
  let html = rendered
  for (;;) {
    const titleMatch = /^<title[^>]*>([\s\S]*?)<\/title>/.exec(html)
    if (titleMatch) {
      title = decodeEntities(titleMatch[1])
      html = html.slice(titleMatch[0].length)
      continue
    }
    const tagMatch = /^<(?:meta|link)\b[^>]*>/.exec(html)
    if (tagMatch) {
      // Stamped so the browser can find and drop them once React takes over
      // (see the mount block above).
      elements.add(tagMatch[0].replace(/^<(meta|link)\b/, '<$1 data-prerender-head'))
      html = html.slice(tagMatch[0].length)
      continue
    }
    break
  }
  return { title, elements, html }
}

export async function prerender(data: { url: string }) {
  // Server-only imports stay dynamic so they never inflate the browser bundle.
  const { prerender: prerenderToStream } = await import('react-dom/static.edge')
  const { parseLinks } = await import('vite-prerender-plugin/parse')
  // Each company has its own page, but the career timeline shows companies
  // inline instead of linking to them — so the link crawler can never find
  // those pages. Hand them over directly.
  const { careers } = await import('./data/career')

  // React streams by default: once ~12KB has been written it stops inlining
  // finished Suspense boundaries and instead parks them in a hidden <div> at
  // the end of the page for JavaScript to move into place. Pages here are much
  // bigger than that, so every route came out as a "loading…" placeholder with
  // the real page hidden underneath. A chunk size larger than any page we will
  // ever render turns that off: the markup lands where it belongs and the first
  // paint IS the page, with or without JavaScript.
  const { prelude } = await prerenderToStream(<App url={data.url} />, {
    progressiveChunkSize: 1_000_000_000,
  })
  const rendered = await new Response(prelude).text()

  const { title, elements, html } = splitHoistedHead(rendered)

  return {
    html,
    // The crawler follows these to find every other page to prerender.
    links: new Set([...parseLinks(html), ...careers.map((c) => `/career/${c.slug}`)]),
    head: { title, elements },
  }
}
