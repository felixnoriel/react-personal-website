/* STUB - replaced by its owner during the section build. */
import { Link } from 'react-router'
import { Monogram } from '../marks'

export function SheetHeader() {
  return (
    <header className="sheet-header">
      <div className="sheet sheet-header__inner">
        <Link to="/" className="sheet-header__brand" aria-label="Felix Noriel, home">
          <Monogram />
          <span>Felix Noriel</span>
        </Link>
      </div>
    </header>
  )
}
