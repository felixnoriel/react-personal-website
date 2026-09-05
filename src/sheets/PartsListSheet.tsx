import { Fragment } from 'react'
import { Section } from './Section'
import { STACKS, TOOL_COUNT, LIVE_COUNT, MAX_YEARS, type Skill } from '../data/skills'
import './parts.css'

// Sheet 4 - the parts list.
//
// The toolbox set as a bill of materials rather than a skills cloud: three
// stacks, sub-grouped, every tool visible, each row carrying its item number,
// its real years, and a mark saying whether it is still in daily use. The
// short hairline after each years figure is the same number drawn to scale
// (longest run = full 48px), so the list reads as a chart as well as a list.
// Nothing here moves and nothing here needs JavaScript.

/** A tool's years drawn as a hairline: the real value, on a scale set by the
 *  longest-running tool in the whole list. */
function yearsBar(years: number) {
  return {
    '--y': years,
    '--fallback-w': `${((years / MAX_YEARS) * 48).toFixed(2)}px`,
  } as React.CSSProperties
}

function PartRow({ item }: { item: Skill }) {
  const legacy = item.note === 'legacy'
  return (
    <li className="part">
      <span className="part__no meta" aria-hidden="true" />
      <span className="part__name">{item.name}</span>
      <span className="leader" aria-hidden="true" />
      <span className="part__years meta meta--pen">{item.years ? `${item.years}y` : ''}</span>
      <span className="part__track" aria-hidden="true">
        {item.years ? <span className="part__bar" style={yearsBar(item.years)} /> : null}
      </span>
      <span className="part__status">
        {item.live && (
          <>
            <span className="sq" aria-hidden="true" />
            <span className="visually-hidden">live</span>
          </>
        )}
        {legacy && (
          <>
            <span className="sq sq--open" aria-hidden="true" />
            <span className="visually-hidden">legacy</span>
          </>
        )}
      </span>
    </li>
  )
}

export function PartsListSheet() {
  return (
    <Section
      id="sheet-parts"
      title="Tools and tech I reach for every day."
      intro="A decade of shipping across startups, media, and Web3 — here's what's in the current toolbox, booted and running."
      meta={`${TOOL_COUNT} tools · ${LIVE_COUNT} live`}
      cvHeight={2400}
    >
      <p className="parts__legend meta meta--label">
        <span className="parts__legend-item">
          <span className="sq" aria-hidden="true" />
          live
        </span>
        <span className="parts__legend-item">
          <span className="sq sq--open" aria-hidden="true" />
          legacy
        </span>
      </p>

      <div className="parts" style={{ '--y-max': MAX_YEARS } as React.CSSProperties}>
        {STACKS.map((stack) => (
          <div className="parts__stack" key={stack.id}>
            <h3 className="parts__title">{stack.title}</h3>
            <p className="parts__caption meta meta--label">{stack.caption}</p>
            {stack.groups.map((group) => (
              <Fragment key={group.label}>
                <h4 className="parts__group meta meta--head">{group.label}</h4>
                <ol className="parts__list">
                  {group.items.map((item) => (
                    <PartRow key={item.name} item={item} />
                  ))}
                </ol>
              </Fragment>
            ))}
          </div>
        ))}
      </div>
    </Section>
  )
}
