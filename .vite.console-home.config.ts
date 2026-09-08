// Scratch config: builds ONLY the SIGNAL home page, so my verification is not
// blocked while another owner's page group is mid-edit. Same root, same alias.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const ROOT = '/Users/felixnoriel/Projects/react-personal-website'

export default defineConfig({
  root: ROOT,
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(ROOT, './src') } },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: { 'proto-signal': path.resolve(ROOT, 'proto/signal/index.html') },
      output: {
        manualChunks(id: string) {
          if (id.includes('src/data/blog')) return 'data-blog'
          if (id.includes('src/data/career')) return 'data-career'
          if (id.includes('src/data/projects')) return 'data-projects'
        },
      },
    },
  },
})
