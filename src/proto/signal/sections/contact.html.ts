/**
 * CONTACT + FOOTER — static markup, rendered at build time.
 *
 * Three top-level blocks come out of here, on purpose:
 *   1. <section id="contact">  the transmission console (the chapter anchor)
 *   2. <footer class="ftr">    the end of the page
 *   3. <div id="beamAnchors">  the HTML pinned to the sculpture
 * The anchors are a separate sibling because the two blocks above carry
 * `content-visibility: auto`, and a fixed overlay inside a skipped subtree
 * would blink out with it.
 *
 * Every string here is the live site's own copy (ContactSection.tsx,
 * layout/Footer.tsx, shared/content.ts) — nothing invented.
 */
import { SECTIONS, EMAIL, SOCIALS, FOOTER } from '../../shared/content'

/** two-letter call signs for the four socials, in SOCIALS order */
const MARKS = ['in', 'gh', 'fb', 'ig']

/** the eight ticks that climb the beam; three of them are the form's fields */
const RUNGS = [
  { k: 0, n: '' },
  { k: 1, n: '01' },
  { k: 2, n: '' },
  { k: 3, n: '02' },
  { k: 4, n: '' },
  { k: 5, n: '03' },
  { k: 6, n: '' },
  { k: 7, n: '' },
]

const NAV = [
  { name: 'Home', href: '/' },
  { name: 'Work', href: '/projects' },
  { name: 'Experience', href: '/career' },
  { name: 'Skills', href: '#skills' },
  { name: 'Writing', href: '/blog' },
]

const field = (id: string, label: string, rung: number, input: string) => `
              <label class="ct-field" for="${id}" data-rung="${rung}">
                <span class="ct-lab mono">${label}</span>
                ${input}
                <i class="ct-edge" aria-hidden="true"></i>
              </label>`

export function render(): string {
  const c = SECTIONS.contact
  const year = new Date().getFullYear()
  const mailCoffee = `mailto:${EMAIL}?subject=${encodeURIComponent('Virtual coffee?')}`
  return `
      <section class="chapter ct" id="contact" data-shape="7" aria-labelledby="contact-title">
        <div class="ct-head">
          <div class="ct-headrow">
            <span class="kicker mono rev">${c.index} — ${c.eyebrow}</span>
            <span class="ct-channel mono rev"
              ><i class="dot"></i>open channel<b class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></b></span
            >
          </div>
          <h2 class="rev" id="contact-title">Got something in mind? <em>Let&rsquo;s talk.</em></h2>
          <p class="ct-intro rev">${c.intro}</p>
        </div>

        <div class="ct-grid">
          <form class="ct-form glass rev" id="ctForm" aria-describedby="ctWire">
            <div class="ct-formhead mono">
              <span>compose</span><span class="ct-dest">→ ${EMAIL}</span>
            </div>
${field(
  'ct-name',
  'callsign · your name',
  1,
  `<input class="ct-in" id="ct-name" name="name" type="text" required autocomplete="name" placeholder="jane doe" />`,
)}
${field(
  'ct-mail',
  'reply-to · email',
  3,
  `<input class="ct-in" id="ct-mail" name="email" type="email" required autocomplete="email" placeholder="jane@somewhere.co" />`,
)}
${field(
  'ct-msg',
  'transmission · message',
  5,
  `<textarea class="ct-in ct-area" id="ct-msg" name="message" rows="4" required placeholder="what's on your mind? a build · a bug · a bad joke..."></textarea>`,
)}

            <div class="ct-meter" aria-hidden="true">
              <span class="ct-meterbar"><i id="ctFill"></i></span>
              <span class="mono ct-metern" id="ctBytes">0 B</span>
            </div>

            <div class="ct-actions">
              <button class="cta solid ct-send" type="submit" id="ctSend">
                <span class="ct-sendlabel">Send message</span>
                <span class="arw" aria-hidden="true">↗</span>
              </button>
              <p class="ct-wire mono" id="ctWire">opens your mail app · nothing is stored here</p>
            </div>
            <p class="ct-log mono" id="ctLog" role="status" aria-live="polite"></p>
          </form>

          <div class="ct-side">
            <article class="ct-card glass rev" id="ctStation">
              <div class="ct-cardhead mono"><i class="dot dot-lime"></i>currently operating from</div>
              <div class="ct-city">Bangkok</div>
              <div class="mono ct-coord">13.75°N · 100.50°E · TH</div>
              <div class="ct-clockrow mono">
                <span>local <b id="ctClock">--:--:--</b></span>
                <span class="ct-tz">GMT+7</span>
              </div>
              <div class="ct-day" aria-hidden="true"><i id="ctDay"></i></div>
              <p class="ct-note">Remote, async-friendly · usually reply within 24h.</p>
            </article>

            <article class="ct-card glass rev" id="ctMail">
              <div class="ct-cardhead mono"><i class="dot dot-el"></i>direct · email</div>
              <div class="ct-mailrow">
                <a class="ct-addr" href="mailto:${EMAIL}">${EMAIL}</a>
                <button class="ct-copy" id="ctCopy" type="button" aria-label="Copy email address">
                  <span class="ct-copyi" aria-hidden="true">⧉</span>
                  <span class="ct-copyd" aria-hidden="true">✓</span>
                </button>
              </div>
              <div class="mono ct-sub">preferred for proposals · async · anytime</div>
            </article>

            <article class="ct-card glass rev" id="ctCoffee">
              <div class="ct-cardhead mono"><i class="dot dot-mg"></i>or · a virtual coffee</div>
              <div class="ct-coffee">Let&rsquo;s grab a virtual coffee.</div>
              <p class="ct-note">Always up for a good chat about products, engineering, and food.</p>
              <a class="ct-brew mono" href="${mailCoffee}"><b>$</b> brew ./coffee <span aria-hidden="true">↗</span></a>
            </article>
          </div>
        </div>
      </section>

      <footer class="ftr" id="ftr">
        <div class="ftr-in">
          <div class="ftr-eyebrow mono rev">
            <span>— Let&rsquo;s build something</span>
            <span class="ftr-live"><i class="dot"></i>online · accepting dms</span>
          </div>
          <h2 class="ftr-h">
            <span class="rev">${FOOTER.headline[0]}</span>
            <a class="rev ftr-hello" href="mailto:${EMAIL}" id="ctHello">Say hello</a><span class="rev ftr-dot">.</span>
          </h2>

          <div class="ftr-grid">
            <div class="ftr-me">
              <div class="ftr-id">
                <span class="ftr-mark" aria-hidden="true">F</span>
                <div>
                  <div class="ftr-name">Felix Noriel</div>
                  <div class="ftr-role mono">Product Engineer · Asia</div>
                </div>
              </div>
              <p class="ftr-blurb">${FOOTER.blurb}</p>
              <ul class="ftr-soc">
                ${SOCIALS.map(
                  (s, i) =>
                    `<li><a href="${s.url}" target="_blank" rel="noopener noreferrer" data-soc="${i}"><b class="mono">${MARKS[i]}</b>${s.name}</a></li>`,
                ).join('\n                ')}
              </ul>
            </div>

            <nav class="ftr-nav" aria-label="Footer">
              <div class="ftr-cap mono">Navigate</div>
              <ul>
                ${NAV.map((l) => `<li><a href="${l.href}">${l.name}<span class="arw" aria-hidden="true">↗</span></a></li>`).join(
                  '\n                ',
                )}
              </ul>
            </nav>

            <div class="ftr-con">
              <div class="ftr-cap mono">Contact</div>
              <ul>
                <li><a href="mailto:${EMAIL}">${EMAIL}</a></li>
                ${FOOTER.facts.map((f) => `<li>${f}</li>`).join('\n                ')}
              </ul>
            </div>
          </div>

          <div class="ftr-legal">
            <p class="mono">© <span id="ctYear">${year}</span> ${FOOTER.legal}</p>
            <p class="mono ftr-utc"><i class="ftr-term" aria-hidden="true">▸</i><b id="ctUtc">--:--</b> · UTC</p>
          </div>
        </div>
      </footer>

      <div id="beamAnchors" aria-hidden="true">
        <div class="ba ba-muzzle" id="baMuzzle">
          <span class="ba-chip mono"><i class="dot"></i>uplink · open</span>
        </div>
        ${RUNGS.map(
          (r) =>
            `<div class="ba ba-rung" data-rung="${r.k}"><i class="ba-tick"></i>${
              r.n ? `<b class="mono">${r.n}</b>` : ''
            }</div>`,
        ).join('\n        ')}
        <div class="ba ba-base" id="baBase"><span class="ba-chip mono">origin · bkk</span></div>
        <div class="ba ba-pkt" id="baPkt"><span class="ba-car mono"><b>tx</b><span id="baPktN">0 B</span></span></div>
      </div>`
}
