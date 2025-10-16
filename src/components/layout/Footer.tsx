import { Link } from 'react-router-dom'
import { Socials } from '../Socials'
import { Button } from '../ui/button'

export function Footer() {
  return (
    <div className="mt-auto">
      {/* Connect Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="bg-dark-slate text-white rounded-lg shadow-xl p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center md:text-left">
              <div>
                <h2 className="text-3xl font-bold">Connect with me</h2>
              </div>
              <div>
                <h3 className="text-lg opacity-90">You can follow me or just send a message and say Hello</h3>
              </div>
              <div className="flex justify-center md:justify-end">
                <a href="mailto:jrnoriel_56@yahoo.com">
                  <Button
                    variant="outline"
                    className="border-white text-black hover:bg-white hover:text-slate-900 rounded-full px-8 transition-colors"
                    size="lg"
                  >
                    Message me
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-teal-gradient text-white py-12">
        <div className="container mx-auto max-w-7xl px-4 text-center">
          <div className="mb-6 flex justify-center">
            <Socials />
          </div>
          <p className="mb-4">
            <Link to="/about" className="hover:underline hover:opacity-80 transition-opacity">
              About this website
            </Link>
          </p>
          <p className="text-sm opacity-90">
            Created by Felix Noriel <i className="far fa-copyright" /> {new Date().getFullYear()}
          </p>
        </div>
      </footer>

      {/* Font Awesome */}
      <script defer src="https://use.fontawesome.com/releases/v5.1.0/js/all.js" />
    </div>
  )
}
