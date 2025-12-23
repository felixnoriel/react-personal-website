import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { ExternalLink, Code2, Users, Zap, TrendingUp } from 'lucide-react'
import type { Project, Tag } from '../types/data'
import { trackProjectView, trackButtonClick } from '../utils/analytics'

interface ProductsBuiltProps {
  projects: Project[]
  showViewAllLink?: boolean
}

// Helper to replace Zookal with CEO Magazine Intranet and get specific stats
const transformProject = (project: Project): Project & { stats?: { label: string, value: string, icon: any }[] } => {
  if (project.slug === 'genopets') {
    return {
      ...project,
      title: 'Genopets Gaming Platform',
      stats: [
        { label: 'MAU', value: '150k', icon: Users },
        { label: 'msgs/day', value: '7.5M', icon: Zap },
        { label: 'faster', value: '80%', icon: TrendingUp },
      ]
    }
  } else if (project.slug  === 'dashify') {
    return {
      ...project,
      title: 'Dashify Hospitality Platform',
      stats: [
        { label: 'venues', value: '20+', icon: Users },
        { label: 'MAU', value: '5k', icon: Zap },
        { label: 'cost savings', value: '75%', icon: TrendingUp },
      ]
    }
  } 
  
  if (project.title.toLowerCase().includes('zookal') || project.slug === 'the-ceo-magazine-website') {
     return {
         ...project,
         // Ensure we use the CEO Magazine title we want if it's the 3rd item
         title: project.slug === 'the-ceo-magazine-website' ? 'The CEO Magazine Website' : project.title
     }
  }

  return project
}

export function ProductsBuilt({ projects, showViewAllLink = true }: ProductsBuiltProps) {
  const displayProjects = projects.map(transformProject)

  return (
    <section id="projects-section" className="py-20 relative overflow-hidden bg-gradient-to-br from-emerald-50/50 via-teal-50/50 to-cyan-50/50 scroll-mt-28">
      {/* Background decoration - Copied from TravelStories */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute bottom-20 right-1/4 w-96 h-96 bg-gradient-to-br from-teal-400/10 to-cyan-400/10 rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        
        {/* Header - V2 Design */}
        <div className="text-center mb-16">
            <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', duration: 0.8 }}
                className="text-5xl mb-4 inline-block"
            >
                🚀
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-pink-500">
                Products I've Built
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
                From Web3 gaming platforms to hospitality SaaS - I build products that scale and solve real problems 💪
            </p>
        </div>

        <div className="space-y-12 mb-20">
          {displayProjects.map((project, index) => (
            <motion.div
              key={project.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link 
                to={`/projects/${project.slug}`} 
                onClick={() => trackProjectView(project.title)}
                className="block group"
              >
                  <Card className="overflow-hidden border border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white group rounded-3xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                        
                      {/* Left Side: Image & Overlays */}
                      <div className="relative h-80 lg:h-auto overflow-hidden bg-gray-100">
                        {project.image?.url ? (
                          <img
                            src={project.image.url}
                            alt={project.title}
                            width={800}
                            height={600}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Code2 className="w-12 h-12" />
                          </div>
                        )}
                        
                        {/* Dark Overlay for contrast */}
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-500" />

                        {/* Top Left: Logo */}
                        <div className="absolute top-6 left-6">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg p-2">
                                {project.company?.image?.url ? (
                                    <img 
                                        src={project.company.image.url} 
                                        alt={project.company.title} 
                                        width={64}
                                        height={64}
                                        loading="lazy"
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <span className="text-2xl">⚡</span>
                                )}
                            </div>
                        </div>

                        {/* Top Right: Featured Badge */}
                        <div className="absolute top-6 right-6">
                            <Badge className="bg-amber-400 hover:bg-amber-500 text-white border-0 px-4 py-1.5 text-sm font-medium rounded-full flex items-center gap-1 shadow-lg">
                                <span className="text-lg">⭐</span> Featured
                            </Badge>
                        </div>

                        {/* Bottom: Stats (Only show for Genopets as per design, or generic if needed) */}
                        {(project as any).stats && (
                            <div className="absolute bottom-6 left-6 right-6 flex gap-3">
                                {(project as any).stats.map((stat: any, i: number) => (
                                    <div key={i} className="flex-1 bg-white/90 backdrop-blur-md rounded-xl p-3 shadow-lg border border-white/50">
                                        <div className="flex items-center gap-2 mb-1">
                                            <stat.icon className="w-4 h-4 text-pink-500" />
                                        </div>
                                        <div className="text-sm font-medium text-gray-900">{stat.value} {stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                      </div>

                      {/* Right Side: Content */}
                      <div className="p-8 lg:p-10 flex flex-col justify-center">
                        <h3 className="text-2xl font-bold mb-4 text-gray-900 group-hover:text-pink-600 transition-colors">
                            {project.title}
                        </h3>
                        
                        <div 
                          className="text-gray-500 mb-8 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: project.excerpt || project.content.substring(0, 150) + '...' }} 
                        />

                        {/* Tech Stack Pills - Colorful */}
                        <div className="flex flex-wrap gap-2 mb-10">
                            {project.tags?.slice(0, 7).map((tag: Tag, i: number) => {
                                const colors = [
                                    'bg-violet-500', 'bg-indigo-500', 'bg-blue-500', 
                                    'bg-sky-500', 'bg-cyan-500', 'bg-teal-500', 'bg-purple-500'
                                ]
                                return (
                                    <Badge key={tag.slug} className={`${colors[i % colors.length]} hover:${colors[i % colors.length]} text-white border-0 px-3 py-1 rounded-md text-xs font-semibold`}>
                                        {tag.name}
                                    </Badge>
                                )
                            })}
                        </div>

                        {/* Buttons - Visual Only */}
                        <div className="flex gap-4">
                            <div className="w-full flex items-center justify-center h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-violet-200 transition-all rounded-md">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                See Project
                            </div>
                        </div>
                      </div>

                    </div>
                  </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* View All Button */}
        {showViewAllLink && (
            <div className="text-center mb-20">
                <Link 
                    to="/projects"
                    onClick={() => trackButtonClick('View All Projects', 'ProductsBuilt')}
                >
                    <Button size="lg" className="bg-pink-500 hover:bg-pink-600 text-white shadow-lg shadow-pink-200 transition-all px-8 rounded-full h-12 text-md font-medium">
                        View All Projects
                        <ExternalLink className="ml-2 w-4 h-4" />
                    </Button>
                </Link>
            </div>
        )}

      </div>
    </section>
  )
}
