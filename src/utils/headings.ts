/**
 * The legacy CMS bodies start their sub-heads at h3. When a body has no h2 at
 * all, promote every h3 to h2 so the outline runs h1 then h2 with no skipped
 * level; a body that already has h2s keeps its own hierarchy.
 */
export const liftHeadings = (html: string) =>
  /<h2[\s>]/i.test(html) ? html : html.replace(/<(\/?)h3(\s|>)/gi, '<$1h2$2')
