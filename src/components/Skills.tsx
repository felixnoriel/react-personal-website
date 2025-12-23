import { FileCode, GitBranch, Terminal, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

const skillCategories = [
  {
    title: 'Frontend Magic ✨',
    color: 'from-violet-500 to-purple-600',
    bgColor: 'from-violet-500/10 to-purple-500/10',
    Icon: FileCode,
    skills: [
      { name: 'React (Hooks, Vite, NextJs)', level: 95 },
      { name: 'TypeScript', level: 92 },
      { name: 'Tailwind, Chakra, Material, Shadcn', level: 90 },
      { name: 'GraphQL', level: 85 },
      { name: 'Storybook/Webpack/Turborepo', level: 80 },
      { name: 'Jest/Playwright', level: 85 },
    ],
  },
  {
    title: 'Backend Power 🚀',
    color: 'from-pink-500 to-rose-600',
    bgColor: 'from-pink-500/10 to-rose-500/10',
    Icon: GitBranch,
    skills: [
      { name: 'Node (NestJS, Express, Koa)', level: 95 },
      { name: 'Java, .NET, C#, PHP', level: 75 },
      { name: 'PostgreSQL/MySQL', level: 90 },
      { name: 'Firebase/DocumentDB/Convex', level: 85 },
      { name: 'New Relic/Sentry', level: 80 },
    ],
  },
  {
    title: 'DevOps & Tools 🛠️',
    color: 'from-orange-500 to-amber-600',
    bgColor: 'from-orange-500/10 to-amber-500/10',
    Icon: Terminal,
    skills: [
      { name: 'Google Cloud (Run, Functions, BigQuery)', level: 90 },
      { name: 'AWS (CDK, ECS, Lambda, S3)', level: 88 },
      { name: 'Docker', level: 85 },
      { name: 'CI/CD (CircleCI, GitHub Actions)', level: 88 },
      { name: 'Vercel', level: 92 },
      { name: 'Redis/Elasticache/Algolia', level: 80 },
    ],
  },
]

const stats = [
  { value: '12+', label: 'Years Experience', icon: '⏰' },
  { value: '50+', label: 'Projects', icon: '🚀' },
  { value: '∞', label: 'Coffee Cups', icon: '☕' },
  { value: '100%', label: 'Passion', icon: '❤️' },
]

export function Skills() {
  return (
    <div>
      {/* Header Section */}
      <section id="skills-section" className="bg-gradient-primary text-white py-20">
        <div className="container mx-auto max-w-7xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              I have over 12 years of experience as a Full-Stack Software Engineer
            </h1>
            <h2 className="text-lg md:text-xl lg:text-2xl opacity-90">
              Strategising, designing, and developing big scalable applications from end to end
            </h2>
          </motion.div>
        </div>
      </section>

      {/* Skills Cards Section */}
      <section className="py-16 bg-gradient-to-br from-violet-50/50 via-white to-pink-50/50 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-violet-400/20 to-pink-400/20 rounded-full blur-3xl animate-blob" />
          <div className="absolute bottom-20 left-20 w-64 h-64 bg-gradient-to-br from-orange-400/20 to-amber-400/20 rounded-full blur-3xl animate-blob-delay-1" />
        </div>

        <div className="container mx-auto max-w-7xl px-4 relative z-10">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', duration: 0.8 }}
              className="inline-block mb-4"
            >
              <div className="w-16 h-16 mx-auto bg-gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="text-white w-8 h-8" />
              </div>
            </motion.div>
            <h2 className="text-3xl font-bold mb-4 text-gradient-primary">My Superpowers</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              An ever-growing arsenal of technologies I use to build amazing things 🎯
            </p>
          </motion.div>

          {/* Skill Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {skillCategories.map((category, categoryIndex) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: categoryIndex * 0.2 }}
              >
                <div className="bg-white/80 backdrop-blur border-2 border-violet-100 hover:border-violet-300 rounded-xl p-6 h-full shadow-sm hover:shadow-2xl transition-all duration-300">
                  {/* Category Icon */}
                  <motion.div whileHover={{ scale: 1.05, rotate: 5 }} className="mb-6">
                    <div
                      className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${category.bgColor} border border-violet-200`}
                    >
                      <category.Icon className="w-6 h-6 text-violet-600" />
                    </div>
                  </motion.div>

                  <h3 className="text-xl font-semibold mb-6">{category.title}</h3>

                  {/* Skills with Progress Bars */}
                  <div className="space-y-4">
                    {category.skills.map((skill, skillIndex) => (
                      <motion.div
                        key={skill.name}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.3,
                          delay: categoryIndex * 0.2 + skillIndex * 0.1,
                        }}
                        className="group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm group-hover:text-violet-600 transition-colors">
                            {skill.name}
                          </span>
                          <span className="text-sm text-muted-foreground">{skill.level}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${skill.level}%` }}
                            viewport={{ once: true }}
                            transition={{
                              duration: 1,
                              delay: categoryIndex * 0.2 + skillIndex * 0.1,
                              ease: 'easeOut',
                            }}
                            className={`h-full bg-gradient-to-r ${category.color} rounded-full relative overflow-hidden`}
                          >
                            <div className="absolute inset-0 bg-white/30 animate-shimmer" />
                          </motion.div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Fun Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: 0.8 + index * 0.1,
                  type: 'spring',
                }}
                whileHover={{ scale: 1.05, rotate: 2 }}
              >
                <div className="p-4 text-center bg-gradient-to-br from-white to-violet-50/50 border-2 border-violet-100 rounded-xl">
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <div className="text-2xl font-bold text-gradient-primary mb-1">{stat.value}</div>
                  <div className="text-muted-foreground text-sm">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  )
}
