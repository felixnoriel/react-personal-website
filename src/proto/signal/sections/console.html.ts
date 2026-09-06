/** console — the header (name, nav, clock) and the palette. STUB: the console owner replaces this. */
export function header(): string {
  return `
    <header class="rail-top mono">
      <div><b>FELIX NORIEL</b><span class="sep">/</span><span class="sig">SIGNAL</span></div>
      <nav aria-label="Sections" class="topnav">
        <a href="#experience">Experience</a><a href="#work">Work</a><a href="#skills">Skills</a><a href="#nomad">Nomad</a><a href="#writing">Writing</a><a href="#contact">Contact</a>
      </nav>
      <div><span id="clockLabel">BKK</span>&nbsp;<span id="clock">--:--:--</span></div>
    </header>`
}
export function after(): string {
  return ''
}
