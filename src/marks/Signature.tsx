import type { SVGProps } from 'react'

/**
 * The signature in the footer title block - one continuous cursive stroke
 * reading "Felix", plus the flick over the i.
 *
 * It is drawn by hand rather than set in a script typeface on purpose: a
 * generic script font is exactly the thing the Device Ledger deletes. The
 * stroke is `currentColor` so it inks itself in whatever the title block is
 * set in, and `vector-effect` keeps it a true 1px line at any rendered size.
 * Decorative: the name it spells is already set as real text beside it.
 */
export function Signature({ className, ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 152 66"
      width="152"
      height="66"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path
        vectorEffect="non-scaling-stroke"
        d="M12 37C24 35 40 32 54 28C55 16 46 4 37 7C28 10 24 23 30 31C34 37 35 43 34 49C33 56 40 57 44 50C48 45 51 34 58 33C65 32 65 41 55 40C50 39 55 49 66 47C75 44 84 30 82 17C81 9 74 10 74 19C74 29 80 42 87 47C91 50 95 43 98 34C100 40 101 45 104 47C109 43 116 37 121 31C125 27 122 24 116 26C111 28 107 30 103 32C108 38 115 43 124 47C130 49 135 46 139 41M98 23C99 22 101 22 102 22"
      />
    </svg>
  )
}
