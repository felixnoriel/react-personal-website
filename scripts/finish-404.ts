/**
 * Vercel serves `404.html` from the output directory, with a real 404 status,
 * for any path that has no file. The prerender step writes the not-found
 * sheet as dist/404/index.html (nested, like every route); this copies it to
 * where Vercel looks. There is no catch-all rewrite any more: every route is
 * a real file, so nothing needs one.
 */
import { copyFileSync, existsSync } from 'node:fs'

const src = 'dist/404/index.html'
if (!existsSync(src)) {
  console.error('finish-404: dist/404/index.html missing - is /404 in additionalPrerenderRoutes?')
  process.exit(1)
}
copyFileSync(src, 'dist/404.html')
console.log('finish-404: dist/404.html written')
