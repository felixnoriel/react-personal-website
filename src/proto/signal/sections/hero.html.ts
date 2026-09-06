/** the hero, verbatim from the prototype (owned by the orchestrator) */
export function render(): string {
  return `
      <section class="hero">
        <div class="block">
          <div class="status mono">
            <span class="pill"><i class="dot"></i>available for work</span>
            <span class="where">Bangkok · UTC+7 · remote-friendly</span>
          </div>

          <h1><span class="ink">Product Engineer</span></h1>
          <p class="sub">Startups · Web3 · Fintech</p>

          <ul class="bio">
            <li>I'm <strong>Felix</strong> — a senior full-stack engineer and technical co-founder.</li>
            <li>13+ years shipping software for startups across Web3, fintech, hospitality, and media.</li>
            <li>Currently based in Asia and digital nomading with the fam.</li>
          </ul>

          <div class="ctas">
            <a class="cta solid" href="#work">See selected work <span class="arw">↗</span></a>
            <a class="cta ghost glass" href="#contact">Get in touch <span class="arw">↗</span></a>
          </div>
        </div>

        <dl class="instr">
          <div class="cap mono"><span>impact</span><span>2013 → now</span></div>
          <div class="readout glass">
            <dt>messages / day</dt>
            <dd data-count="7.5M+">7.5M+</dd>
            <span class="note">event pipeline → BigQuery</span>
          </div>
          <div class="readout glass">
            <dt>monthly actives</dt>
            <dd data-count="150k">150k</dd>
            <span class="note">Genopets · Web3 gaming</span>
          </div>
          <div class="readout glass">
            <dt>faster p95</dt>
            <dd data-count="80%">80%</dd>
            <span class="note">latency optimization</span>
          </div>
          <div class="readout glass">
            <dt>users reached</dt>
            <dd data-count="1.8M+">1.8M+</dd>
            <span class="note">notification system</span>
          </div>
        </dl>
      </section>
`
}
