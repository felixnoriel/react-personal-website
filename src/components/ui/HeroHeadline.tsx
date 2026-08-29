import { useMemo, useRef, useState } from 'react'
import { KineticHeadline } from './KineticHeadline'
import { ParticleHeadline } from './ParticleHeadline'
import { useFxLevel } from '../../hooks/useFxLevel'

/**
 * HeroHeadline — picks the strongest headline treatment the device can run:
 *
 *   particles → the WebGL particle swarm (ParticleHeadline). The DOM text
 *               paints first for LCP/SEO, then ghosts to a faint watermark
 *               while ~10k particles assemble and carry the visual.
 *   kinetic   → no WebGL (or it failed/was lost): the scramble-in +
 *               variable-font cursor-swell text treatment.
 *   static    → prefers-reduced-motion: plain aurora text, no engines.
 *
 * The h1 wrapper stays `relative` so the particle canvas can overlay the
 * exact text box; the ghosted text keeps its full layout size, so nothing
 * shifts when modes change.
 */

const LINE_1 = 'Product Engineer'
const LINE_2 = 'Problem Solver'

export function HeroHeadline() {
  const { reduceMotion, isMobile } = useFxLevel()
  const hostRef = useRef<HTMLDivElement>(null)
  const line1Ref = useRef<HTMLSpanElement>(null)
  const line2Ref = useRef<HTMLSpanElement>(null)
  const lineRefs = useMemo(() => [line1Ref, line2Ref], [])
  const [glFailed, setGlFailed] = useState(false)
  const [assembled, setAssembled] = useState(false)

  const particles = !reduceMotion && !glFailed

  return (
    <div ref={hostRef} className={`relative ${assembled && particles ? 'headline-ghost' : ''}`}>
      <span
        ref={line1Ref}
        className="hl-swap block whitespace-nowrap text-[9vw] md:text-[80px]"
      >
        {particles ? (
          <span className="aurora-text electric-text aurora-cool hero-fx">{LINE_1}</span>
        ) : (
          <KineticHeadline variant="cool" className="hero-fx" text={LINE_1} />
        )}
      </span>
      <span
        ref={line2Ref}
        className="hl-swap block whitespace-nowrap text-[7.6vw] md:text-[72px]"
      >
        {particles ? (
          <span className="aurora-text electric-text aurora-warm electric-offset hero-fx">
            {LINE_2}
          </span>
        ) : (
          <KineticHeadline
            variant="warm"
            className="electric-offset hero-fx"
            text={LINE_2}
            delay={260}
          />
        )}
      </span>
      {particles && (
        <ParticleHeadline
          hostRef={hostRef}
          lineRefs={lineRefs}
          isMobile={isMobile}
          onAssembled={() => setAssembled(true)}
          onFail={() => {
            setGlFailed(true)
            setAssembled(false)
          }}
        />
      )}
    </div>
  )
}
