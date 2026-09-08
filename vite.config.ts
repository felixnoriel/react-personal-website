import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { globSync } from 'node:fs'

export default defineConfig({
  plugins: [react()],
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
      // every rendered page (scripts/render-signal.ts) is its own entry
      input: Object.fromEntries(
        ['index.html', ...globSync('{career,projects,blog,about,404}/**/index.html', { cwd: __dirname })].map((f) => [
          f === 'index.html' ? 'main' : path.dirname(f).replace(/[\\/]/g, '-'),
          path.resolve(__dirname, f),
        ]),
      ),
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
