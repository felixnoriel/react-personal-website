import { Rocket, Calendar, Award, Building2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ViewAllLink } from '../ViewAllLink'
import type { Career } from '../../types/data'

interface CareerTimelineProps {
  experiences: Career[]
  indexPage?: boolean
}

const emojiMap: { [key: string]: string } = {
  genopets: '🚀',
  dashify: '⚡',
  default: '🎨',
}

const colorMap: { [key: string]: string } = {
  genopets: 'from-violet-500 to-purple-600',
  dashify: 'from-pink-500 to-rose-600',
  default: 'from-orange-500 to-amber-600',
}

export function CareerTimeline({ experiences, indexPage }: CareerTimelineProps) {
  return (
    <section className="py-20 bg-gradient-to-br from-pink-50/50 via-white to-orange-50/50 relative overflow-hidden">
      {/* Decorative blob */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-10 w-72 h-72 bg-gradient-to-br from-violet-400/10 to-pink-400/10 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 15, repeat: Infinity }}
        />
      </div>

      <div className="container mx-auto max-w-7xl px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0, rotate: 45 }}
            whileInView={{ scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', duration: 0.8 }}
            className="inline-block mb-4"
          >
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Rocket className="text-white w-8 h-8" />
            </div>
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient-primary">My Journey</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A timeline of my professional adventures in the world of software development 🗺️
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="max-w-4xl mx-auto space-y-8">
          {experiences.map((exp, index) => {
            const emoji = emojiMap[exp.slug] || emojiMap.default
            const color = colorMap[exp.slug] || colorMap.default

            return (
              <motion.div
                key={exp.slug}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <motion.div whileHover={{ scale: 1.02 }} className="relative">
                  {/* Timeline connector */}
                  {index < experiences.length - 1 && (
                    <motion.div
                      initial={{ height: 0 }}
                      whileInView={{ height: '100%' }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: index * 0.2 + 0.3 }}
                      className="absolute left-7 top-20 w-0.5 h-full bg-gradient-to-b from-violet-300 to-pink-300 -z-10"
                    />
                  )}

                  <Link
                    to={`/career/${exp.slug}`}
                    className="block bg-white/80 backdrop-blur border-2 border-transparent hover:border-violet-200 rounded-xl p-6 shadow-sm hover:shadow-2xl transition-all duration-300"
                  >
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Icon and timeline */}
                      <div className="flex md:flex-col items-center md:items-start gap-4">
                        <motion.div whileHover={{ scale: 1.1, rotate: 10 }} className="relative">
                          <motion.div
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [0.5, 0.8, 0.5],
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              delay: index * 0.5,
                            }}
                            className={`absolute inset-0 bg-gradient-to-br ${color} rounded-2xl blur-md`}
                          />
                          <div className="relative w-14 h-14 bg-gradient-to-br from-white to-gray-50 rounded-2xl flex items-center justify-center border-2 border-violet-200 shadow-lg text-2xl">
                            {emoji}
                          </div>
                        </motion.div>

                        {/* Calendar badge */}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-violet-100 to-pink-100 rounded-full border border-violet-200">
                          <Calendar className="w-3 h-3 text-violet-600" />
                          <span className="text-sm text-violet-700">
                            {exp.startDate} - {exp.endDate}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-grow">
                        <div className="mb-3">
                          <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                            <span dangerouslySetInnerHTML={{ __html: exp.jobTitle }} />
                            <motion.div
                              animate={{ rotate: [0, 15, 0] }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: index * 0.3,
                              }}
                            >
                              <Award className="w-4 h-4 text-yellow-500" />
                            </motion.div>
                          </h3>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: exp.title }} />
                          </div>
                        </div>

                        {exp.location && (
                          <p className="text-sm text-muted-foreground mb-3">
                            📍 {exp.location}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              </motion.div>
            )
          })}
        </div>

        <ViewAllLink route="career" indexPage={indexPage} />

        {/* Achievement callout */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 max-w-3xl mx-auto"
        >
          <div className="p-8 bg-gradient-to-br from-violet-500/10 via-pink-500/10 to-orange-500/10 border-2 border-violet-200 rounded-xl">
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="text-6xl"
              >
                🏆
              </motion.div>
              <div className="flex-grow">
                <h3 className="text-xl font-bold mb-2">Always Learning & Growing</h3>
                <p className="text-muted-foreground">
                  Constantly exploring new technologies and methodologies to stay at the cutting edge. 
                  Currently diving deep into AI/ML integration and Web3 technologies!
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
