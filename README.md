# Felix Noriel - personal site

A portfolio set like a working engineer's drawing sheet: cream paper, one vertical datum rule, three inks (graphite, ballpoint, red pencil), two typefaces, and a career timeline drawn to a true 2013-to-now axis that you can scrub.

Live: https://felixnoriel-dashify.vercel.app

## Stack

- React 19.2 with the React Compiler, Vite 8 (Rolldown), TypeScript, react-router 8 in declarative mode.
- Every route is rendered to real static HTML at build time (`vite-prerender-plugin` + `react-dom/static`), then hydrated. The whole stylesheet is inlined into each page, so the first paint is the finished page.
- Plain CSS. No Tailwind, no animation library, no icon library. Four runtime dependencies.
- Two self-hosted OFL typefaces (Fraunces for display, Host Grotesk for text), instanced and subset offline with metric-matched fallbacks.
- The Sheet Change morph is the browser's View Transition API driven by hand around the router; the career scrubber is a native range input; tech ink uses the CSS Custom Highlight API.

## Commands

```bash
bun install
bun run dev            # http://localhost:9000
bun run build          # vite build + prerender, then the two gates below
bun run check:prerender   # every sheet and a sample of routes are in the static HTML
bun run check:anti-ai     # the compiled CSS has no gradients, blurs, shadows, radii or mono faces
bun run lint           # eslint incl. a CSS Baseline gate
bun run images         # re-optimise the content images (outputs are committed)
bun run blog:split     # regenerate the blog index and per-post content chunks from src/data/blog.ts
```

Fonts: `bash scripts/subset-fonts.sh <Fraunces.ttf> <HostGrotesk.ttf> <HostGrotesk-Italic.ttf>` (needs a Python venv with fontTools + brotli). The social card: `python3 scripts/build-og.py`.

## Where things live

- `src/data/` - the content. `career.ts`, `projects.ts` and `blog.ts` are hand-maintained; `blog-index.ts`, `blog-content/` and `images/*.generated.ts` are generated.
- `src/styles/` - tokens, fonts, base, the sheet grid, motion.
- `src/sheets/` - one component + one stylesheet per home sheet, the header, the footer, the sheet index.
- `src/pages/` and `src/components/{career,project,blog}/` - the index and detail routes.
- `src/transitions/sheetChange.ts` - the morph. `src/utils/timeline.ts` - the axis math. `src/utils/plot.ts` - the city plot.
- `scripts/` - image optimisation, blog split, font subsetting, the social card, the two build gates.

The previous site is preserved on the `old-site` branch and the `pre-redesign-2026-09-05` tag.
