import { motion } from 'framer-motion'
import { Card } from './ui/card'
import { Plane, Coffee, MapPin, Wifi, Utensils, Camera } from 'lucide-react'
import { trackEvent } from '../utils/analytics'

// Mock Data
const workspaces = [
  {
    image: 'https://images.unsplash.com/photo-1649061267116-bf9d813b3757?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwbm9tYWQlMjBsYXB0b3AlMjBjYWZlfGVufDF8fHx8MTc2NTMyNTcwNHww&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Cafe Coding',
    location: 'Tokyo, Japan',
    icon: Coffee,
    description: 'Best matcha lattes while debugging',
  },
  {
    image: 'https://images.unsplash.com/photo-1609765685592-703a97c877ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhaXJwbGFuZSUyMHdpbmRvdyUyMHRyYXZlbHxlbnwxfHx8fDE3NjUzMDE2MTF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Cloud Office',
    location: '35,000 ft',
    icon: Plane,
    description: 'Where merge conflicts meet turbulence',
  },
  {
    image: 'https://images.unsplash.com/photo-1652793822328-47340b1b4407?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwd2Fsa2luZyUyMHN0cmVldHxlbnwxfHx8fDE3NjUzMjU3MDR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'City Explorer',
    location: 'Street Markets',
    icon: MapPin,
    description: 'Best ideas come while walking',
  },
  {
    image: 'https://images.unsplash.com/photo-1758767055219-35755e2d76bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJlZXQlMjBmb29kJTIwY3VsdHVyZXxlbnwxfHx8fDE3NjUzMjU3MDR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    title: 'Food Adventures',
    location: 'Everywhere',
    icon: Utensils,
    description: 'Trying local cuisines between commits',
  },
]

const lifestyleStats = [
  { emoji: '🌍', value: '12+', label: 'Countries Coded From' },
  { emoji: '✈️', value: '4', label: 'Years as Nomad' },
  { emoji: '☕', value: '1000+', label: 'Cafes Explored' },
  { emoji: '🍜', value: '500+', label: 'Local Dishes Tried' },
  { emoji: '📸', value: '10k+', label: 'Travel Photos' },
  { emoji: '💻', value: '24/7', label: 'Laptop Always Ready' },
]

export function NomadLife() {
  return (
    <section id="nomad-section" className="py-20 bg-gradient-to-br from-cyan-50/50 via-blue-50/50 to-indigo-50/50 relative overflow-hidden scroll-mt-28">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
            backgroundSize: '100% 100%',
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
              y: [0, -10, 0],
            }}
            transition={{ duration: 5, repeat: Infinity }}
            className="text-6xl mb-4 inline-block"
          >
            🎒
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Living the Digital Nomad Life
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            For 4 years, I've been building products from the most incredible
            places around the world. My office? Anywhere with WiFi and good coffee! ☕
          </p>
        </motion.div>

        {/* Workspace photos */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 max-w-7xl mx-auto">
          {workspaces.map((workspace, index) => (
            <motion.div
              key={workspace.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
              onMouseEnter={() => trackEvent('Nomad Life', 'Workspace View', workspace.title)}
            >
              <Card className="overflow-hidden border-2 hover:border-blue-300 transition-all hover:shadow-2xl group h-full">
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={workspace.image}
                    alt={workspace.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <motion.div
                    className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2"
                    whileHover={{ scale: 1.2, rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <workspace.icon className="w-5 h-5 text-blue-600" />
                  </motion.div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h4 className="text-white font-bold mb-1">{workspace.title}</h4>
                    <p className="text-white/80 text-sm mb-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {workspace.location}
                    </p>
                    <p className="text-white/70 text-xs italic">"{workspace.description}"</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Lifestyle stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-6xl mx-auto mb-16"
        >
          {lifestyleStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: 0.6 + index * 0.1,
                type: 'spring',
              }}
              whileHover={{ scale: 1.1, rotate: 5 }}
              onMouseEnter={() => trackEvent('Nomad Life', 'Stat View', stat.label)}
            >
              <Card className="p-4 text-center bg-white/80 backdrop-blur-sm border-2 border-blue-200 hover:shadow-xl transition-all">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: index * 0.2,
                  }}
                  className="text-4xl mb-2"
                >
                  {stat.emoji}
                </motion.div>
                <div className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-1 font-bold">
                  {stat.value}
                </div>
                <div className="text-muted-foreground text-xs">{stat.label}</div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Philosophy card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <Card className="p-8 bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-indigo-500/10 border-2 border-blue-300 relative overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                <motion.div
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="text-6xl shrink-0"
                >
                  🌏
                </motion.div>
                <div>
                  <h3 className="mb-3 text-2xl font-bold flex items-center justify-center md:justify-start gap-2 text-blue-900">
                    Why I Love This Lifestyle
                    <motion.span
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      ❤️
                    </motion.span>
                  </h3>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    Being a digital nomad isn't just about working from exotic
                    locations - it's about experiencing diverse cultures, meeting
                    incredible people, and constantly challenging myself both
                    professionally and personally. <strong>Every new city brings fresh
                    perspectives that influence how I build products.</strong>
                  </p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    {[
                      { icon: Camera, text: 'New Perspectives' },
                      { icon: Utensils, text: 'Culinary Adventures' },
                      { icon: Wifi, text: 'Work Flexibility' },
                      { icon: Coffee, text: 'Coffee Culture' },
                    ].map((item) => (
                      <motion.div
                        key={item.text}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="flex items-center gap-2 px-3 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-blue-200 text-blue-800"
                      >
                        <item.icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{item.text}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
