import { Code2, Server, Cloud, Sparkles, Zap, Database, Boxes, TestTube } from 'lucide-react';
import { motion } from 'framer-motion';
import { SkillBubble } from './SkillBubble';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    }
  }
};

export function TechToolbelt() {
  return (
    <section id="skills-section" className="py-20 relative overflow-hidden bg-gradient-to-br from-violet-50/50 via-white to-pink-50/50 scroll-mt-28">
       {/* Decorative blobs - Optimizing potential paint costs by adding static pointers */}
       <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-br from-violet-400/5 to-purple-400/5 rounded-full blur-[100px] will-change-[filter]" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-pink-400/5 to-orange-400/5 rounded-full blur-[100px] will-change-[filter]" />
      </div>

    <div className="container mx-auto max-w-[1600px] px-4 relative z-10">
      {/* Header */}
      <div className="text-center mb-12">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-3 mb-4"
        >
          <Sparkles className="w-8 h-8 text-yellow-400" />
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
            My Tech Toolbelt
          </h2>
          <Sparkles className="w-8 h-8 text-yellow-400" />
        </motion.div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          A constellation of skills & technologies I use to build amazing products.
        </p>
      </div>

      {/* Main Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-12 gap-6 auto-rows-auto"
      >
        
        {/* Frontend Section - Takes 4 columns */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <motion.div 
            className="bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-3xl p-6 h-full shadow-lg hover:shadow-xl transition-all duration-300 will-change-transform"
          >
            {/* Same content but inside a staggered container now */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
                <Code2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Front end</h2>
                <p className="text-sm text-blue-600 font-medium">User interfaces & experiences</p>
              </div>
            </div>

            {/* Frameworks */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Boxes className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm text-blue-600 font-bold uppercase tracking-wider">Frameworks</h3>
              </div>
              <div className="space-y-2">
                <SkillBubble 
                  name="React, React Native" 
                  tags={['Hooks', 'Vite', 'NextJS']}
                  size="medium"
                  color="blue"
                  icon="⚛️"
                />
                <SkillBubble 
                  name="AngularJS / jQuery" 
                  compact
                  tags={['Legacy support']}
                  size="medium"
                  color="blue"
                  icon="🅰️"
                />
              </div>
            </div>

            {/* UI Libraries */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm text-blue-600 font-bold uppercase tracking-wider">UI</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <SkillBubble name="Tailwind" size="medium" color="blue" compact icon="🌊" />
                <SkillBubble name="Chakra" size="medium" color="blue" compact icon="⚡" />
                <SkillBubble name="Material" size="medium" color="blue" compact icon="Ⓜ️" />
                <SkillBubble name="Shadcn" size="medium" color="blue" compact icon="⚫" />
              </div>
            </div>

            {/* Others */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm text-blue-600 font-bold uppercase tracking-wider">Others</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <SkillBubble name="GraphQL" size="medium" color="blue" compact icon="◈" />
                <SkillBubble name="Storybook" size="medium" color="blue" compact icon="📕" />
                <SkillBubble name="Turborepo" size="small" color="blue" compact icon="🏎️" />
                <SkillBubble name="Webpack" size="medium" color="blue" compact icon="📦" />
              </div>
            </div>

            {/* Testing */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TestTube className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm text-blue-600 font-bold uppercase tracking-wider">Testing</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <SkillBubble name="Jest" size="medium" color="blue" compact icon="🃏" />
                <SkillBubble name="Playwright" size="medium" color="blue" compact icon="🎭" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Backend Section - Takes 4 columns */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <motion.div 
             className="bg-white/80 backdrop-blur-sm border border-green-200/50 rounded-3xl p-6 h-full shadow-lg hover:shadow-xl transition-all duration-300 will-change-transform"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-md">
                <Server className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Back end</h2>
                <p className="text-sm text-green-600 font-medium">Server & data logic</p>
              </div>
            </div>

            {/* Languages */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Code2 className="w-4 h-4 text-green-500" />
                <h3 className="text-sm text-green-600 font-bold uppercase tracking-wider">Languages</h3>
              </div>
              <div className="space-y-2">
                <SkillBubble 
                  name="Node.js" 
                  tags={['NestJS', 'Express', 'Koa']}
                  size="medium"
                  color="green"
                  icon="🟢"
                />
                <div className="flex flex-wrap gap-2">
                  <SkillBubble name="Java" size="medium" color="green" compact icon="☕" />
                  <SkillBubble name=".NET" size="small" color="green" compact icon="🔷" />
                  <SkillBubble name="C#" size="small" color="green" compact icon="#️⃣" />
                  <SkillBubble name="PHP" size="medium" color="green" compact icon="🐘" />
                </div>
              </div>
            </div>

            {/* Databases */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-4 h-4 text-green-500" />
                <h3 className="text-sm text-green-600 font-bold uppercase tracking-wider">Databases</h3>
              </div>
              <div className="space-y-2">
                
                <div className="flex flex-wrap gap-2">
                  <SkillBubble name="PostgreSQL" size="medium" color="green" compact icon="🐘" />
                  <SkillBubble name="MySQL" size="medium" color="green" compact icon="🐬" />
                  <SkillBubble 
                    compact
                    name="Firebase" 
                    tags={['DocumentDB']}
                    size="medium" 
                    color="green" 
                    icon="🔥"
                  />
                  <SkillBubble name="Convex" size="small" color="green" compact icon="🚀" />
                </div>
              </div>
            </div>

            {/* Monitoring */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-green-500" />
                <h3 className="text-sm text-green-600 font-bold uppercase tracking-wider">Monitoring</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <SkillBubble name="New Relic" size="medium" color="green" compact icon="📊" />
                <SkillBubble name="Sentry" size="medium" color="green" compact icon="🚨" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* DevOps Section - Takes 4 columns */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <motion.div 
             className="bg-white/80 backdrop-blur-sm border border-orange-200/50 rounded-3xl p-6 h-full shadow-lg hover:shadow-xl transition-all duration-300 will-change-transform"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md">
                <Cloud className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">DevOps</h2>
                <p className="text-sm text-orange-600 font-medium">Cloud & infrastructure</p>
              </div>
            </div>

            {/* Google Cloud */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <Cloud className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm text-orange-600 font-bold uppercase tracking-wider">Google Cloud</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <SkillBubble name="Cloud Run" size="medium" color="orange" compact icon="☁️" />
                <SkillBubble name="Functions" size="medium" color="orange" compact icon="λ" />
                <SkillBubble name="Cloud Tasks" size="medium" color="orange" compact icon="📋" />
                <SkillBubble name="Pub/Sub" size="medium" color="orange" compact icon="📨" />
                <SkillBubble name="BigQuery" size="medium" color="orange" compact icon="🔍" />
                <SkillBubble name="Cloud SQL" size="medium" color="orange" compact icon="💾" />
                <SkillBubble name="Storage" size="medium" color="orange" compact icon="📦" />
                <SkillBubble name="Cloud Build" size="medium" color="orange" compact icon="🔨" />
              </div>
            </div>

            {/* AWS */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <Cloud className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm text-orange-600 font-bold uppercase tracking-wider">AWS</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <SkillBubble name="CDK" size="medium" color="orange" compact icon="💻" />
                <SkillBubble name="CloudFormation" size="medium" color="orange" compact icon="📄" />
                <SkillBubble name="ECS" size="medium" color="orange" compact icon="🐳" />
                <SkillBubble name="EC2" size="medium" color="orange" compact icon="🖥️" />
                <SkillBubble name="SNS/SQS" size="medium" color="orange" compact icon="📨" />
                <SkillBubble name="Lambda" size="medium" color="orange" compact icon="λ" />
                <SkillBubble name="S3" size="medium" color="orange" compact icon="🪣" />
                <SkillBubble name="CloudFront" size="medium" color="orange" compact icon="🌐" />
                <SkillBubble name="RDS" size="medium" color="orange" compact icon="💾" />
                <SkillBubble name="API Gateway" size="medium" color="orange" compact icon="🚪" />
                <SkillBubble name="ELB" size="medium" color="orange" compact icon="⚖️" />
              </div>
            </div>

            {/* Others */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Boxes className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm text-orange-600 font-bold uppercase tracking-wider">Others</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <SkillBubble name="Docker" size="medium" color="orange" compact icon="🐳" />
                <SkillBubble name="Vercel" size="medium" color="orange" compact icon="▲" />
                <SkillBubble name="GitHub Actions" size="medium" color="orange" compact icon="🐙" />
                <SkillBubble name="Circle CI" size="medium" color="orange" compact icon="⭕" />
                <SkillBubble name="Redis" size="medium" color="orange" compact icon="🧠" />
                <SkillBubble name="Elasticache" size="medium" color="orange" compact icon="🧠" />
                <SkillBubble name="Algolia" size="medium" color="orange" compact icon="🔍" />
                <SkillBubble name="Typesense" size="small" color="orange" compact icon="⚡" />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

    </div>
    </section>
  );
}
