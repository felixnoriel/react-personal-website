/**
 * Vercel serves dist/404.html with a real 404 status for any path that has
 * no file (there is no catch-all rewrite any more: every route is a file).
 * The renderer writes the not-found page as 404/index.html; copy it there.
 */
import { copyFileSync, existsSync } from 'node:fs'

const src = 'dist/404/index.html'
if (!existsSync(src)) {
  console.error('finish-404: dist/404/index.html missing')
  process.exit(1)
}
copyFileSync(src, 'dist/404.html')
console.log('finish-404: dist/404.html written')
