import { Header } from './Header'
import { Footer } from './Footer'
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
    </div>
  )
}
