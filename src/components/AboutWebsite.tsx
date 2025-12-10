import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Code2, Server, Cloud, User, Sparkles } from 'lucide-react'

export function AboutWebsite() {
  return (
    <div className="bg-gradient-to-br from-indigo-50/50 via-white to-pink-50/50 min-h-screen py-20 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-violet-400/10 to-purple-400/10 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-pink-400/10 to-orange-400/10 rounded-full blur-3xl" />
        </div>

        <section className="container mx-auto max-w-5xl px-4 relative z-10">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-16"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', duration: 0.8 }}
                    className="inline-block mb-4"
                >
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-violet-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <User className="w-8 h-8 text-white" />
                    </div>
                </motion.div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-violet-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                    About Me
                </h2>
                <div className="max-w-2xl mx-auto text-xl text-muted-foreground leading-relaxed">
                    <p className="mb-4">
                        I'm a Product-focused <strong>Senior Software Engineer</strong> based in{' '}
                        <span className="text-violet-600 font-semibold">Sydney, Australia</span> 🇦🇺
                    </p>
                    <p>
                        When I'm not in front of my computer, I like to cook, trying out
                        different restaurants and cuisines, and traveling every once in a while. 🍜
                    </p>
                </div>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 mb-16">
                 {/* About Website */}
                 <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                 >
                    <Card className="h-full border-2 border-violet-100 hover:border-violet-300 transition-colors shadow-lg">
                        <CardHeader>
                             <CardTitle className="flex items-center gap-2 text-2xl">
                                <Code2 className="w-6 h-6 text-violet-600" />
                                Front End
                             </CardTitle>
                        </CardHeader>
                        <CardContent>
                             <ul className="space-y-4">
                                {['React 18 with custom hooks', 'Vite for fast build times', 'React Router 7 for routing', 'Context API for state', 'TypeScript for safety', 'Tailwind CSS v4 & Shadcn/ui'].map((item) => (
                                    <li key={item} className="flex items-start gap-2">
                                        <Sparkles className="w-4 h-4 text-violet-400 mt-1 shrink-0" />
                                        <span className="text-muted-foreground">{item}</span>
                                    </li>
                                ))}
                             </ul>
                        </CardContent>
                    </Card>
                 </motion.div>

                 <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                 >
                     <div className="space-y-8 h-full">
                        <Card className="border-2 border-pink-100 hover:border-pink-300 transition-colors shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-2xl">
                                    <Server className="w-6 h-6 text-pink-600" />
                                    Back End
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-4">
                                    {['WordPress (Legacy CMS)', 'Static JSON Data', 'WordPress API Integration'].map((item) => (
                                        <li key={item} className="flex items-start gap-2">
                                            <Sparkles className="w-4 h-4 text-pink-400 mt-1 shrink-0" />
                                            <span className="text-muted-foreground">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="border-2 border-orange-100 hover:border-orange-300 transition-colors shadow-lg bg-gradient-to-br from-white to-orange-50/30">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-2xl">
                                    <Cloud className="w-6 h-6 text-orange-600" />
                                    Hosting
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="px-4 py-2 text-lg bg-orange-100 text-orange-800 hover:bg-orange-200">
                                        Deploying on Vercel 🚀
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                     </div>
                 </motion.div>
            </div>
            
            <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-center text-sm text-muted-foreground"
            >
                Developed with ❤️ by Felix Noriel
            </motion.p>
        </section>
    </div>
  )
}
