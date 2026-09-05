/**
 * Loads a single blog post's HTML body on demand.
 *
 * Only /blog/:slug needs a post's `content` - the home page and /blog list
 * work off blog-index.ts (metadata only). Each file in blog-content/ is its
 * own module, so Vite/Rolldown gives each post its own chunk: visiting one
 * post never downloads another post's body.
 *
 * import.meta.glob builds a static map of slug -> dynamic import at build
 * time (no runtime path concatenation reaching outside blog-content/), and
 * the promise cache below means calling loadBlogContent(slug) twice for the
 * same slug returns the SAME promise object - required for React's `use()`,
 * which would otherwise re-suspend forever on a fresh promise every render.
 */
const modules = import.meta.glob<{ content: string }>('./blog-content/*.ts')

const cache = new Map<string, Promise<string>>()

export function loadBlogContent(slug: string): Promise<string> {
  const cached = cache.get(slug)
  if (cached) return cached

  const loader = modules[`./blog-content/${slug}.ts`]
  const promise = loader
    ? loader().then((mod) => mod.content)
    : Promise.reject(new Error(`No blog content for slug "${slug}"`))

  cache.set(slug, promise)
  return promise
}
