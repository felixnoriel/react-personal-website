
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    Briefcase,
    MapPin,
    Layout,
    ArrowRight,
    Shield,
    BarChart3,
    Zap,
    Mail,
    Rocket,
    Target,
    Banknote,
    Smartphone,
    CreditCard,
    ShoppingCart,
    Code2,
    Cloud,
    Server,
    Users,
    Database,
    Wrench,
    Code,
    FileCode,
    CheckCircle,
    Layers,
    Bug,
    BookOpen,
    HelpCircle,
    type LucideIcon
} from 'lucide-react'
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Career } from '@/types/data'

interface BuildingJourneyProps {
  experiences: Career[]
  showViewAllLink?: boolean
}

const iconMap: Record<string, LucideIcon> = {
    Shield,
    BarChart3,
    Zap,
    Mail,
    Rocket,
    Target,
    Banknote,
    Smartphone,
    CreditCard,
    ShoppingCart,
    Code2,
    Cloud,
    Server,
    Users,
    Database,
    Wrench,
    Code,
    FileCode,
    CheckCircle,
    Layers,
    Bug,
    BookOpen
}

export function BuildingJourney({ experiences, showViewAllLink = true }: BuildingJourneyProps) {

  return (
    <section id="career-section" className="py-20 relative overflow-hidden bg-gray-50/50 scroll-mt-28">
       <div className="container mx-auto px-4 max-w-5xl relative z-10">
         <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
         >
           <motion.div
             initial={{ scale: 0 }}
             whileInView={{ scale: 1 }}
             viewport={{ once: true }}
             transition={{ type: 'spring', duration: 0.8 }}
             className="text-6xl mb-4 inline-block"
           >
             🚀
           </motion.div>
           <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
             My Building Journey
           </h2>
           <p className="text-xl text-gray-500 max-w-2xl mx-auto">
             A timeline of products, startups, and teams I've helped build and grow.
           </p>
         </motion.div>

         <div className="space-y-12">
            {experiences.map((exp, index) => {
                // Default to a gray generic color if not provided
                const brandColor = exp.color || 'bg-gradient-to-r from-gray-700 to-gray-900'
                const achievements = exp.achievements || []
                const techs = exp.techStack || []
                const isPresent = exp.endDate.toLowerCase() === 'present'

                return (
                    <motion.div
                        key={exp.slug}
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Link to={exp.linkToProject ? `/projects/${exp.slug}` : `/career/${exp.slug}`} className="block group">
                            <Card className="overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 bg-white rounded-2xl">

                                {/* Header Section (Brand Color) */}
                                <div className={`${brandColor} p-6 md:p-8 text-white relative`}>
                                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                                        <div className="flex items-center gap-6">
                                            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg p-2 shrink-0">
                                                {exp.image?.url ? (
                                                    <img
                                                        src={exp.image.url}
                                                        alt={exp.title}
                                                        className="w-full h-full object-contain"
                                                    />
                                                ) : (
                                                    <span className="text-3xl">🏢</span>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-2xl md:text-3xl font-bold mb-1">{exp.title}</h3>
                                                <div className="flex items-center gap-2 opacity-90 text-sm md:text-base">
                                                    <Briefcase className="w-4 h-4" />
                                                    {exp.jobTitle}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-start md:items-end gap-1 opacity-90 text-sm md:text-base w-full md:w-auto mt-2 md:mt-0">
                                            <div className="font-medium bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                                                {exp.startDate} - {exp.endDate}
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <MapPin className="w-4 h-4" />
                                                {exp.location}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Body Section */}
                                <div className="p-6 md:p-8">

                                    {/* Achievements Grid */}
                                    {achievements.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                            {achievements.map((achievement, i) => {
                                                const IconComponent = iconMap[achievement.icon] || HelpCircle

                                                return (
                                                    <div key={i} className="border border-gray-100 bg-gray-50/50 rounded-xl p-5 flex gap-4 hover:border-gray-200 transition-colors">
                                                        <div className="mt-1">
                                                            <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center border border-gray-100">
                                                                <IconComponent className={`w-5 h-5 text-gray-700`} />
                                                            </div>
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-start gap-2 mb-2">
                                                                <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">
                                                                    {achievement.title}
                                                                </h4>
                                                                {achievement.badge && (
                                                                    <Badge variant="secondary" className="bg-gray-200/50 text-gray-700 text-xs whitespace-nowrap">
                                                                        {achievement.badge}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">
                                                                {achievement.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        // Fallback for content if no structured achievements (should be rare now)
                                        <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-100 text-gray-600 leading-relaxed">
                                            <div dangerouslySetInnerHTML={{ __html: exp.excerpt || exp.content }} />
                                        </div>
                                    )}

                                    {/* Footer: Tech Stack */}
                                    {techs.length > 0 && (
                                        <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
                                            <div className="text-gray-400 font-medium flex items-center gap-2">
                                                <Layout className="w-4 h-4" />
                                                Tech Stack:
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {techs.map((tech) => (
                                                    <Badge
                                                        key={tech}
                                                        className="bg-violet-100 hover:bg-violet-200 text-violet-700 border-0 px-3 py-1 font-medium"
                                                    >
                                                        {tech}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </Link>
                    </motion.div>
                )
            })}

            {showViewAllLink && (
                <div className="mt-16 text-center">
                    <Link to="/career">
                        <Button
                            size="lg"
                            variant="outline"
                            className="bg-pink-500 hover:bg-pink-600 text-white shadow-lg shadow-pink-200 transition-all px-8 rounded-full h-12 text-md font-medium"
                        >
                            See All Experience
                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </div>
            )}
        </div>
       </div>
    </section>
  )
}

