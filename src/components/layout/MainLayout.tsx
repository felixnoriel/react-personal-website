import { Header } from './Header'
import { Footer } from './Footer'
import { CursorAura } from '../ui/CursorAura'
import { ScrollProgress } from '../ui/ScrollProgress'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div id="main-wrapper" className="min-h-screen flex flex-col">
      <ScrollProgress />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      {/* Site-wide cursor aura — comet trail + click shockwaves + soft halo.
          Fixed-position canvas above content (z-40, below header z-50),
          pointer-events: none. Desktop-only; idle-skip handles the
          common no-cursor-activity case at near-zero CPU cost. */}
      <CursorAura />
    </div>
  )
}
