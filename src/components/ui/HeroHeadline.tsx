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

  // Desktop-only swarm: on touch the pointer forces are a mouse affordance
  // that only ever misfired, and the sampled-canvas approach is fragile on
  // the surface that's hardest to test. Mobile gets clean gradient type.
  const particles = !reduceMotion && !isMobile && !glFailed

  return (
    <div ref={hostRef} className="relative">
      <span
        ref={line1Ref}
        className="block whitespace-nowrap text-[clamp(30px,9.6vw,164px)]"
      >
        {particles ? (
          <span className="aurora-text aurora-static aurora-cool">{LINE_1}</span>
        ) : (
          <KineticHeadline variant="cool" className="aurora-static" text={LINE_1} />
        )}
      </span>
      {/* staggered second line — the editorial offset that breaks template
          symmetry and gives the composition its diagonal */}
      <span
        ref={line2Ref}
        className="block whitespace-nowrap pl-[6vw] text-[clamp(30px,9.6vw,164px)]"
      >
        {particles ? (
          <span className="aurora-text aurora-static aurora-warm">{LINE_2}</span>
        ) : (
          <KineticHeadline
            variant="warm"
            className="aurora-static"
            text={LINE_2}
          />
        )}
      </span>
      {particles && (
        <ParticleHeadline
          hostRef={hostRef}
          lineRefs={lineRefs}
          isMobile={isMobile}
          onFail={() => setGlFailed(true)}
        />
      )}
    </div>
  )
}
