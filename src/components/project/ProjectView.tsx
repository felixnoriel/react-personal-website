import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { Picture } from '../Picture'
import { liftHeadings } from '../../utils/headings'
import { IMAGES as galleryImages } from '../../data/images/galleries.generated'
import { ProjectPlate, countWord, projectTitle } from '../../sheets/WorkSheet'
import { ArrowMark, ChevronMark, CloseMark } from '../../marks'
import type { Image as ImageAsset, Project } from '../../types/data'
import '../../sheets/work.css'

/**
 * The project detail sheet.
 *
 * The next sheet in the set: the title arrives from the row that was clicked
 * (Sheet Change pairs it by name), a rule under it, the plate, the tech as
 * square chips, the prose at 36rem on the datum, then the gallery as a strip
 * of plates that snap. The lightbox is a native <dialog> the platform opens
 * from the plate's own invoker command - no lightbox library, no icon set.
 */

const DIALOG_ID = 'plate-viewer'

/** Invoker commands: Baseline newly available 2025-12-12. React passes these
 *  through as plain attributes; the click handler below covers older engines. */
const INVOKE = { command: 'show-modal', commandfor: DIALOG_ID } as Record<string, string>
const platformOpens = () =>
  typeof HTMLButtonElement !== 'undefined' && 'commandForElement' in HTMLButtonElement.prototype

const pad = (n: number) => String(n).padStart(2, '0')

/** The prose is authored with <h3> sub-heads. The page's own heading is the
 *  <h1>, so they are promoted one level to keep the outline in order. Only
 *  the tag changes; not one word of the copy does. */

interface ProjectViewProps {
  project: Project | null
  total: number
  prev: Project | null
  next: Project | null
}

export function ProjectView({ project, total, prev, next }: ProjectViewProps) {
  const gallery = (project?.gallery ?? []).filter((g) => g.url)
  const [active, setActive] = useState(0)
  const dialog = useRef<HTMLDialogElement>(null)

  if (!project) {
    return (
      <article className="detail">
        <Link className="detail__crumb meta" to="/projects">
          <ArrowMark /> {`All ${countWord(total)} projects`}
        </Link>
      </article>
    )
  }

  const title = projectTitle(project)
  const openPlate = (i: number) => {
    setActive(i)
    if (platformOpens()) return
    const d = dialog.current
    if (d && !d.open) d.showModal()
  }
  const step = (by: number) => setActive((i) => (i + by + gallery.length) % gallery.length)

  // One strip per category, in the order the categories first appear. The data
  // is not sorted by category - "Website" comes back after "Mobile" on the CEO
  // Magazine site - so a category is looked up by name, never merged only when
  // it happens to be the last group. Plate numbers stay the gallery's own, so
  // they match the lightbox counter even when a strip's numbers skip.
  type Group = { name: string | null; items: { img: ImageAsset; index: number }[] }
  const groups: Group[] = []
  const byName = new Map<string | null, Group>()
  gallery.forEach((img, index) => {
    const name = img.category ?? null
    let group = byName.get(name)
    if (!group) {
      group = { name, items: [] }
      byName.set(name, group)
      groups.push(group)
    }
    group.items.push({ img, index })
  })

  const shown = gallery[active]

  return (
    <article className="detail">
      <Link className="detail__crumb meta" to="/projects">
        <ArrowMark /> {`All ${countWord(total)} projects`}
      </Link>

      <h1 className="detail__title" dangerouslySetInnerHTML={{ __html: title }} />
      <div className="detail__rule" aria-hidden="true" />
      <p className="detail__excerpt" dangerouslySetInnerHTML={{ __html: project.excerpt }} />

      <figure className="detail__plate">
        <div className="plate">
          <ProjectPlate project={project} sizes="(min-width: 900px) 720px, 92vw" priority />
        </div>
        <figcaption className="meta plate__caption">{project.company?.title ?? title}</figcaption>
      </figure>

      {project.tags.length > 0 && (
        <div className="detail__tags">
          {project.tags.map((tag) => (
            <span className="chip" key={tag.slug} dangerouslySetInnerHTML={{ __html: tag.name }} />
          ))}
        </div>
      )}

      <div className="prose-sheet" dangerouslySetInnerHTML={{ __html: liftHeadings(project.content) }} />

      {gallery.length > 0 && (
        <div className="gallery">
          {groups.map((group, g) => (
            <section className="gallery__group" key={g}>
              {group.name && <h2 className="gallery__head">{group.name}</h2>}
              <ul className="gallery-strip">
                {group.items.map(({ img, index }) => (
                  <li key={img.url}>
                    <figure className="gallery-plate">
                      <button
                        type="button"
                        className="gallery-plate__btn"
                        {...INVOKE}
                        onClick={() => openPlate(index)}
                      >
                        <span className="plate">
                          <Picture src={img.url} from={galleryImages} alt={img.alt || title} sizes="272px" />
                        </span>
                      </button>
                      <figcaption className="meta">{pad(index + 1)}</figcaption>
                    </figure>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <dialog
            id={DIALOG_ID}
            ref={dialog}
            className="lightbox"
            aria-label={title}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') step(1)
              if (e.key === 'ArrowLeft') step(-1)
            }}
          >
            <div className="lightbox__bar">
              <span className="meta">
                {pad(active + 1)} / {pad(gallery.length)}
              </span>
              <button
                type="button"
                className="lightbox__btn"
                aria-label="Close"
                onClick={() => dialog.current?.close()}
              >
                <CloseMark />
              </button>
            </div>
            <figure className="lightbox__figure">
              {shown && <Picture src={shown.url} from={galleryImages} alt={shown.alt || title} sizes="90vw" />}
            </figure>
            <div className="lightbox__foot">
              <button
                type="button"
                className="lightbox__btn lightbox__btn--prev"
                aria-label="Previous image"
                onClick={() => step(-1)}
              >
                <ChevronMark />
              </button>
              <span className="meta">{shown?.category ?? title}</span>
              <button
                type="button"
                className="lightbox__btn lightbox__btn--next"
                aria-label="Next image"
                onClick={() => step(1)}
              >
                <ChevronMark />
              </button>
            </div>
          </dialog>
        </div>
      )}

      {(prev || next) && (
        <nav className="detail__nav" aria-label="Projects">
          {prev && (
            <Link className="detail__nav-prev" to={`/projects/${prev.slug}`}>
              <span className="meta">
                <ArrowMark />
              </span>
              <span className="detail__nav-title" dangerouslySetInnerHTML={{ __html: projectTitle(prev) }} />
            </Link>
          )}
          {next && (
            <Link className="detail__nav-next" to={`/projects/${next.slug}`}>
              <span className="meta">
                <ArrowMark />
              </span>
              <span className="detail__nav-title" dangerouslySetInnerHTML={{ __html: projectTitle(next) }} />
            </Link>
          )}
        </nav>
      )}
    </article>
  )
}
