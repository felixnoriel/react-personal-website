import { motion } from 'framer-motion'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { ArrowRight, Calendar, ExternalLink } from 'lucide-react'
import type { BlogPost } from '../types/data'
import { Link } from 'react-router-dom'

interface TravelStoriesProps {
  stories: BlogPost[]
}

export function TravelStories({ stories }: TravelStoriesProps) {
  // Display only top 4 stories
  const displayStories = stories.slice(0, 4)

  if (!displayStories.length) {
      return null;
  }

  return (
    <section className="py-20 bg-gradient-to-br from-emerald-50/50 via-teal-50/50 to-cyan-50/50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute bottom-20 right-1/4 w-96 h-96 bg-gradient-to-br from-teal-400/10 to-cyan-400/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -50, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 18, repeat: Infinity }}
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
              rotate: [0, 360],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="inline-block text-6xl mb-4"
          >
            ✈️
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Travel Stories & Adventures
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Chronicles from my journey as a digital nomad - where tech meets
            travel, and every location has a story 📖
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-16">
          {displayStories.map((post, index) => (
            <motion.div
              key={post.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="h-full">
                <Link to={`/blog/${post.slug}`}>
                    <Card
                    className={`overflow-hidden h-full border-2 hover:border-teal-300 transition-all hover:shadow-2xl group flex flex-col`}
                    >
                    {/* Image */}
                    <div className="relative aspect-video overflow-hidden">
                        {post.image?.url ? (
                        <img
                        src={post.image.url}
                        alt={post.title}
                        width={800}
                        height={450}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                                <ExternalLink />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                        {/* Category badge */}
                        {post.tags && post.tags.length > 0 && (
                            <div className="absolute bottom-4 left-4">
                            <Badge className="bg-white/90 backdrop-blur-sm text-teal-900 border-0 hover:bg-white">
                                {post.tags[0].name}
                            </Badge>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-6 flex flex-col flex-grow">
                        <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
                            {/* Assuming we might have location in future, for now just Date */}
                            <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{post.publishedDate}</span>
                            </div>
                        </div>

                        <h3 className="text-xl font-bold mb-3 group-hover:text-teal-600 transition-colors line-clamp-2">
                        {post.title}
                        </h3>

                        <p className="text-muted-foreground mb-4 line-clamp-3 flex-grow" dangerouslySetInnerHTML={{ __html: post.excerpt }} />

                        <div className="flex items-center text-teal-600 font-medium group-hover:underline mt-auto">
                        Read Story <ArrowRight className="ml-2 w-4 h-4" />
                        </div>
                    </div>
                    </Card>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA to blog */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center"
        >
          <div className="inline-block relative">
            <Link to="/blog">
                <Button
                    size="lg"
                    className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl px-8 rounded-full h-14 text-lg"
                >
                    <ExternalLink className="mr-2 h-5 w-5" />
                    Visit Full Blog
                </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
