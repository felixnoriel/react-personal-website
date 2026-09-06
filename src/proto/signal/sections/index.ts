/** Wires every section's behaviour once the scene exists. Owners fill their own module; nobody edits this file. */
import type { Scene } from '../scene'
import { init as experience } from './experience'
import { init as work } from './work'
import { init as skills } from './skills'
import { init as nomad } from './nomad'
import { init as writing } from './writing'
import { init as contact } from './contact'
import { init as console } from './console'

export function initSections(scene: Scene) {
  for (const init of [console, experience, work, skills, nomad, writing, contact]) {
    try {
      init(scene)
    } catch (e) {
      // one section must never take the page down
      if (import.meta.env.DEV) throw e
    }
  }
}
