/**
 * StablePaySchematic - the payment flow, drawn by hand.
 *
 * `/stablepay-banner.png` is referenced in projects.ts and does not exist in
 * public/. Rather than a placeholder, the project gets the drawing the rest
 * of the site is set as: two devices, a transfer between them, a border it
 * crosses and a fee node that is empty, in ink hairlines on the plate's own
 * paper tone. The four phrases are the ones the product already uses; they
 * sit on drafting leader lines, the way a callout does on a real sheet.
 *
 * One accent mark: the arrowhead on the transfer. Everything else is graphite.
 * Zero requests, zero JavaScript, about 2 KB inline. Hairlines stay exactly
 * 1px at any rendered size (vector-effect), so it reads the same in the home
 * sheet's plate and full width on the detail page.
 */
export function StablePaySchematic({ title }: { title: string }) {
  return (
    <svg
      className="schematic"
      viewBox="0 0 800 500"
      role="img"
      aria-label={title}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      vectorEffect="non-scaling-stroke"
    >
      <rect className="schematic__ground" x="0" y="0" width="800" height="500" stroke="none" />

      {/* the sender's device, with the token it holds */}
      <g vectorEffect="non-scaling-stroke">
        <rect x="70" y="150" width="150" height="240" />
        <path d="M70 195h150M120 172h50" />
        <rect x="110" y="240" width="70" height="70" />
        <rect x="127" y="257" width="36" height="36" />
      </g>

      {/* the receiver's device, and what lands in it */}
      <g vectorEffect="non-scaling-stroke">
        <rect x="580" y="150" width="150" height="240" />
        <path d="M580 195h150M630 172h50M605 250h95M605 277h64M605 304h95" />
      </g>

      {/* the border the transfer crosses */}
      <path d="M430 110v320" strokeDasharray="7 9" vectorEffect="non-scaling-stroke" />

      {/* the transfer, drawn as segments so nothing is painted over the line */}
      <path d="M240 270h100M360 270h188" vectorEffect="non-scaling-stroke" />
      <path
        className="schematic__accent"
        d="M544 258l18 12-18 12"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />

      {/* the fee node, empty */}
      <rect className="schematic__ground" x="340" y="260" width="20" height="20" stroke="none" />
      <rect x="340" y="260" width="20" height="20" vectorEffect="non-scaling-stroke" />

      {/* four leaders: a shoulder as long as the label sitting on it, then the
          angled line down to a dot on the thing the label names */}
      <g className="schematic__leader" vectorEffect="non-scaling-stroke">
        <path d="M70 90h241l-133 146" />
        <path d="M345 90h225l-74 172" />
        <path d="M90 476h136l124-192" />
        <path d="M718 476H560l-124-56" />
      </g>
      <g className="schematic__dot" stroke="none">
        <circle cx="178" cy="240" r="4" />
        <circle cx="496" cy="270" r="4" />
        <circle cx="350" cy="281" r="4" />
        <circle cx="431" cy="419" r="4" />
      </g>

      <g className="schematic__label">
        <text x="70" y="76">
          USDT Made Easy
        </text>
        <text x="345" y="76">
          Send &amp; Receive
        </text>
        <text x="90" y="462">
          Zero Fees
        </text>
        <text x="560" y="462">
          No Borders
        </text>
      </g>
    </svg>
  )
}
