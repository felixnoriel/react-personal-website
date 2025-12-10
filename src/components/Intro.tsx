import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Plane, Coffee, Wifi, MapPin, Code2, Globe2, Laptop, Sparkles } from 'lucide-react'
import { Button } from './ui/button'

export function Intro() {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 500], [0, 150])

  // Floating elements data
  const floatingElements = [
    { Icon: Plane, x: '10%', y: '20%', duration: 8, delay: 0 },
    { Icon: Coffee, x: '85%', y: '25%', duration: 6, delay: 1 },
    { Icon: Wifi, x: '12%', y: '70%', duration: 7, delay: 2 },
    { Icon: MapPin, x: '88%', y: '65%', duration: 9, delay: 0.5 },
    { Icon: Globe2, x: '15%', y: '45%', duration: 10, delay: 1.5 },
    { Icon: Laptop, x: '82%', y: '85%', duration: 7, delay: 2.5 },
  ]

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)',
            top: '10%',
            left: '10%',
          }}
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(236,72,153,0.3) 0%, transparent 70%)',
            top: '50%',
            right: '10%',
          }}
          animate={{
            x: [0, -80, 0],
            y: [0, -60, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)',
            bottom: '10%',
            left: '40%',
          }}
          animate={{
            x: [0, 60, 0],
            y: [0, -40, 0],
            scale: [1.2, 1, 1.2],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Floating icons */}
      {floatingElements.map((item, index) => (
        <motion.div
          key={index}
          className="absolute hidden lg:block pointer-events-none"
          style={{ left: item.x, top: item.y }}
          animate={{
            y: [0, -30, 0],
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 0.9, 1],
          }}
          transition={{
            duration: item.duration,
            delay: item.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 bg-gradient-to-r from-violet-500 to-pink-500 rounded-2xl blur-xl opacity-40"
            />
            <div className="relative bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-violet-200">
              <item.Icon className="w-6 h-6 text-violet-600" />
            </div>
          </div>
        </motion.div>
      ))}

      {/* Main content - Centered */}
      <motion.div style={{ y }} className="relative z-10 container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Avatar - Emoji */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.8 }}
            className="mb-8 inline-block"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 bg-gradient-to-r from-violet-500 via-pink-500 to-orange-500 rounded-full blur-xl opacity-50"
              />
              <div className="relative w-32 h-32 bg-gradient-to-br from-violet-500 via-pink-500 to-orange-500 rounded-full flex items-center justify-center border-4 border-white shadow-2xl">
                <span className="text-white text-5xl">👨‍💻</span>
              </div>
            </div>
          </motion.div>

          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-6"
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              Hello, my name is{' '}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-violet-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                  Felix Noriel
                </span>
                <motion.span
                  className="absolute bottom-0 left-0 w-full h-3 bg-gradient-to-r from-pink-400/40 to-orange-400/40 -z-10"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                />
              </span>
              , a{' '}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-violet-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                  Software Engineer
                </span>
                <motion.span
                  className="absolute bottom-0 left-0 w-full h-3 bg-gradient-to-r from-violet-400/40 to-pink-400/40 -z-10"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 1.2, duration: 0.8 }}
                />
              </span>
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-8"
          >
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
              who loves{' '}
              <span className="relative inline-block">
                <span className="relative z-10 font-semibold text-gray-900">solving problems</span>
                <motion.span
                  className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-violet-400/40 to-pink-400/40 -z-10"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 1.6, duration: 0.8 }}
                />
              </span>
              {' '}and getting my hands dirty with{' '}
              <span className="relative inline-block">
                <span className="relative z-10 font-semibold text-gray-900">new technologies</span>
                <motion.span
                  className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-pink-400/40 to-orange-400/40 -z-10"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 2.0, duration: 0.8 }}
                />
              </span>
              . Outside work, I'm a{' '}
              <span className="relative inline-block">
                <span className="relative z-10 font-semibold text-gray-900">big foodie</span>
                <motion.span
                  className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400/40 to-amber-400/40 -z-10"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 2.4, duration: 0.8 }}
                />
              </span>
              , loves cooking and traveling every once in a while.
            </p>
            <div className="relative inline-block mb-8">
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-r from-violet-400/20 to-pink-400/20 rounded-2xl blur-xl"
              />
              <p className="relative text-muted-foreground text-lg bg-white/50 backdrop-blur-md px-6 py-4 rounded-2xl border-2 border-violet-200 shadow-lg">
                In the past 4 years, I've been digital nomading in{' '}
                <span className="text-violet-600 font-semibold">
                  12 different countries
                </span>{' '}
                exploring the world and cultures. But now back and based in{' '}
                <span className="text-pink-600 font-semibold">
                  Sydney
                </span>
                , ready for the next adventure. ✨
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-wrap gap-4 justify-center"
          >
            <Button
              size="lg"
              className="group bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white shadow-xl hover:shadow-2xl transition-all h-12 px-8 text-lg rounded-full"
              onClick={() => scrollToSection('projects-section')}
            >
              <Code2 className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
              View My Work
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-violet-300 hover:bg-violet-50 group h-12 px-8 text-lg rounded-full"
              onClick={() => scrollToSection('contact-section')}
            >
              <Sparkles className="mr-2 h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
              Let's Connect
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-muted-foreground text-sm">Scroll to explore</span>
          <div className="w-6 h-10 border-2 border-violet-600/50 rounded-full flex justify-center pt-2">
            <motion.div
              className="w-1.5 h-1.5 bg-gradient-to-b from-violet-600 to-pink-600 rounded-full"
              animate={{ y: [0, 16, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </div>
      </motion.div>
    </section>
  )
}
