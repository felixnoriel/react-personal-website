/**
 * Every route of the site. The home page is composed from the section
 * owners' renderers; the other page groups are owned by their page owners
 * (career.ts, projects.ts, blog.ts, about.ts, notfound.ts).
 */
import type { PageSpec } from '../layout'
import { PAGE } from '../../sections/all'
import { render as hero } from '../../sections/hero.html'
import { SITE } from '../layout'
import { careerPages } from './career'
import { projectPages } from './projects'
import { blogPages } from './blog'
import { aboutPages } from './about'
import { notFoundPages } from './notfound'

export function homePage(): PageSpec {
  return {
    path: '/',
    title: '',
    description: SITE.description,
    css: PAGE.sections.map((s) => s.key),
    main: hero() + '\n' + PAGE.sections.map((s) => s.render()).join('\n'),
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      mainEntity: {
        '@type': 'Person',
        name: 'Felix Noriel',
        jobTitle: 'Product Engineer',
        description: SITE.description,
        url: SITE.url,
        sameAs: [
          'https://www.linkedin.com/in/felixnoriel/',
          'https://github.com/felixnoriel',
          'https://www.facebook.com/felixnoriel',
          'https://www.instagram.com/felixnoriel/',
        ],
      },
    },
  }
}

export function allPages(): PageSpec[] {
  return [homePage(), ...careerPages(), ...projectPages(), ...blogPages(), ...aboutPages(), ...notFoundPages()]
}
