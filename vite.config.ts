import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { vitePrerenderPlugin } from 'vite-prerender-plugin'
import path from 'path'

// The stylesheet is small by design (no gradients, blurs or shadows to
// serialise), so it is inlined into every prerendered page. That removes the
// one render-blocking request between the HTML and the first paint, which on
// a throttled phone is worth roughly 300ms of LCP. The file stays in the
// bundle for anything that still links to it; only the tag changes.
const INLINE_CSS_LIMIT = 80_000

function inlineCriticalCss(): Plugin {
  return {
    name: 'inline-critical-css',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const bundle = ctx.bundle
        if (!bundle) return html
        return html.replace(
          /<link rel="stylesheet"[^>]*href="\/(assets\/[^"]+\.css)"[^>]*>/g,
          (tag, file) => {
            const asset = bundle[file]
            if (!asset || asset.type !== 'asset') return tag
            const css = String(asset.source)
            if (css.length > INLINE_CSS_LIMIT) return tag
            return `<style>${css}</style>`
          },
        )
      },
    },
  }
}

// The two faces that render above the fold are preloaded from the HTML, so
// they arrive alongside the document rather than after the stylesheet has
// been parsed. Hashed names are only known at build time, hence a plugin.
const PRELOAD_FONTS = [/fraunces-display-[\w-]+\.woff2$/, /host-grotesk-[\w-]+\.woff2$/]

function preloadFonts(): Plugin {
  return {
    name: 'preload-fonts',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const bundle = ctx.bundle
        if (!bundle) return []
        return Object.keys(bundle)
          .filter((file) => PRELOAD_FONTS.some((re) => re.test(file)) && !/italic/.test(file))
          .map((file) => ({
            tag: 'link',
            attrs: { rel: 'preload', as: 'font', type: 'font/woff2', crossorigin: true, href: `/${file}` },
            injectTo: 'head' as const,
          }))
      },
    },
  }
}

// The career axis ends "now". That value is fixed at build time so the
// prerendered HTML and the browser draw the same segments (see
// src/utils/timeline.ts); every deploy rebuilds it.
const now = new Date()
const NOW_YEAR = now.getUTCFullYear() + (now.getUTCMonth() + 0.5) / 12

// https://vite.dev/config/
export default defineConfig({
  define: { __NOW_YEAR__: JSON.stringify(Math.round(NOW_YEAR * 10000) / 10000) },
  plugins: [
    // `compiler: true` runs React Compiler through oxc-transform-react (Rust),
    // so components memoise themselves and the hand-written useMemo/useCallback
    // work stops being load-bearing.
    react({ compiler: true }),
    // Renders every route to real HTML at build time. The crawler starts at "/"
    // and follows the links it finds, which reaches the project and blog pages.
    // /about is only reachable from the header menu and /404 from nothing, so
    // both are named here; the per-company career pages are added by the
    // render itself (src/main.tsx), which already has the company list.
    vitePrerenderPlugin({
      renderTarget: '#root',
      additionalPrerenderRoutes: ['/about', '/404'],
    }),
    preloadFonts(),
    inlineCriticalCss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 9000,
    strictPort: true, // Fail if port 9000 is already in use
  },
  build: {
    // Pinned to the same set Vite's 'baseline-widely-available' default
    // resolves to today, so a Vite upgrade can never silently move the floor
    // and start shipping syntax these browsers cannot parse.
    target: ['chrome111', 'edge111', 'firefox114', 'safari16.4'],
    // Every browser in that target list supports modulepreload natively.
    modulePreload: { polyfill: false },
    // Written to dist/.vite/manifest.json and read by scripts/route-preloads.ts,
    // which gives every prerendered page <link rel=modulepreload> tags for its
    // own route chunks (a plugin could only see the one shared template, so
    // every page used to preload the home page's chunks). The script deletes
    // the manifest afterwards so it is not deployed.
    manifest: true,
    chunkSizeWarningLimit: 1000, // Increase limit for large data files
    rolldownOptions: {
      output: {
        // Rolldown's replacement for Rollup's manualChunks: keep each large
        // dataset in its own chunk so no single script blocks the main thread
        // for long, and so a data-only edit does not invalidate app code.
        advancedChunks: {
          groups: [
            // Matches only blog.ts (unused at runtime; kept as the hand-
            // maintained source) and blog-index.ts (metadata, shipped on
            // every page). Deliberately narrower than a plain /blog/ match:
            // that would also catch blog-content.ts and every file under
            // blog-content/ and merge all 18 post bodies into this one
            // chunk, undoing the per-post code splitting those files exist
            // for (see src/data/blog-content.ts).
            { name: 'data-blog', test: /src[\\/]data[\\/]blog(-index)?\.ts$/ },
            { name: 'data-career', test: /src[\\/]data[\\/]career/ },
            { name: 'data-projects', test: /src[\\/]data[\\/]projects/ },
          ],
        },
      },
    },
  },
})
