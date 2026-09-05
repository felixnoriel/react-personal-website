import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { vitePrerenderPlugin } from 'vite-prerender-plugin'
import path from 'path'

// The landing page's critical chunks (Home + motion's domMax features) are
// dynamic imports, so by default the browser only discovers them AFTER the
// entry chunk has downloaded and executed — a serial round-trip that real
// phone networks pay for in full. This plugin injects <link rel="modulepreload">
// tags for them (and their static dep chains) into index.html at build time,
// so they stream in parallel with the entry, starting from the HTML.
// (The chunks stay split — spreading parse/exec across chunks keeps
// main-thread tasks short — only the fetches are parallelized.)
const PRELOAD_FACADES = ['src/pages/Home.tsx', 'src/utils/motionFeatures.ts']

function preloadCriticalChunks(): Plugin {
  return {
    name: 'preload-critical-chunks',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const bundle = ctx.bundle
        if (!bundle) return []
        const files = new Set<string>()
        const addWithDeps = (fileName: string) => {
          if (files.has(fileName)) return
          files.add(fileName)
          const chunk = bundle[fileName]
          if (chunk?.type === 'chunk') chunk.imports.forEach(addWithDeps)
        }
        for (const chunk of Object.values(bundle)) {
          if (
            chunk.type === 'chunk' &&
            chunk.facadeModuleId &&
            PRELOAD_FACADES.some((f) => chunk.facadeModuleId!.endsWith(f))
          ) {
            addWithDeps(chunk.fileName)
          }
        }
        return [...files]
          .filter((file) => !html.includes(file))
          .map((file) => ({
            tag: 'link',
            attrs: { rel: 'modulepreload', crossorigin: true, href: `/${file}` },
            injectTo: 'head' as const,
          }))
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // `compiler: true` runs React Compiler through oxc-transform-react (Rust),
    // so components memoise themselves and the hand-written useMemo/useCallback
    // work stops being load-bearing.
    react({ compiler: true }),
    tailwindcss(),
    // Renders every route to real HTML at build time. The crawler starts at "/"
    // and follows the links it finds, which reaches the project and blog pages.
    // /about is only reachable from the header menu, so it is named here; the
    // per-company career pages are added by the render itself (src/main.tsx),
    // which already has the company list to hand.
    vitePrerenderPlugin({
      renderTarget: '#root',
      additionalPrerenderRoutes: ['/about'],
    }),
    preloadCriticalChunks(),
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
