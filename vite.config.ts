import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// The landing page's critical chunks (Home + framer's domMax features) are
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
  plugins: [react(), preloadCriticalChunks()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 9000,
    strictPort: true, // Fail if port 9000 is already in use
  },
  build: {
    chunkSizeWarningLimit: 1000, // Increase limit for large data files
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split large data files into separate chunks
          if (id.includes('src/data/blog')) return 'data-blog'
          if (id.includes('src/data/career')) return 'data-career'
          if (id.includes('src/data/projects')) return 'data-projects'
        },
      },
    },
  },
})
