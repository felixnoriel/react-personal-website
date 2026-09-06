/**
 * The home page, in order. Each section owner provides <key>.html.ts (the
 * static markup, rendered at build time by scripts/render-signal.ts),
 * <key>.css (inlined into the page head) and <key>.ts (behaviour, wired by
 * sections/index.ts). The console owner also renders the header.
 */
import * as experience from './experience.html'
import * as work from './work.html'
import * as skills from './skills.html'
import * as nomad from './nomad.html'
import * as writing from './writing.html'
import * as contact from './contact.html'
import * as console from './console.html'

export const PAGE = {
  sections: [
    { key: 'experience', render: experience.render },
    { key: 'work', render: work.render },
    { key: 'skills', render: skills.render },
    { key: 'nomad', render: nomad.render },
    { key: 'writing', render: writing.render },
    { key: 'contact', render: contact.render },
  ],
  header: console.header,
  /** markup placed after <main> and the rail (dialogs, the palette) */
  after: console.after,
}
