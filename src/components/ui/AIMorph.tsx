import { motion } from 'framer-motion'

interface AIMorphProps {
  className?: string
}

export function AIMorph({ className = '' }: AIMorphProps) {
  return (
    <span
      className={`relative inline-flex items-center justify-center align-[-0.08em] ${className}`}
      aria-label="AI"
    >
      <motion.span
        aria-hidden
        className="absolute inset-0 -m-3 rounded-[1.2rem] blur-xl"
        style={{
          background:
            'radial-gradient(circle, hsl(var(--accent) / 0.45), hsl(var(--electric) / 0.28), transparent 70%)',
        }}
        animate={{
          scale: [1, 1.18, 1],
          opacity: [0.65, 1, 0.65],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.span
        aria-hidden
        className="absolute inset-0 -m-2 pointer-events-none"
        animate={{ rotate: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
      >
        <span className="absolute top-0 left-1/2 w-1 h-1 -translate-x-1/2 rounded-full bg-lime shadow-[0_0_6px_hsl(var(--lime))]" />
        <span className="absolute bottom-0 left-1/2 w-1 h-1 -translate-x-1/2 rounded-full bg-electric shadow-[0_0_6px_hsl(var(--electric))]" />
        <span className="absolute left-0 top-1/2 w-[3px] h-[3px] -translate-y-1/2 rounded-full bg-accent shadow-[0_0_6px_hsl(var(--accent))]" />
      </motion.span>

      <motion.span
        aria-hidden
        className="absolute inset-0 -m-1 pointer-events-none"
        animate={{ rotate: -360 }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'linear' }}
      >
        <span className="absolute right-0 top-1/2 w-1 h-1 -translate-y-1/2 rounded-full bg-amber shadow-[0_0_6px_hsl(var(--amber))]" />
      </motion.span>

      <span
        aria-hidden
        className="absolute inset-0 -m-1 rounded-xl border border-accent/40 bg-background/80 backdrop-blur-sm overflow-hidden"
      >
        <motion.span
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(100deg, transparent 30%, hsl(var(--accent) / 0.35) 50%, transparent 70%)',
          }}
          animate={{ x: ['-120%', '220%'] }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            repeatDelay: 1.2,
            ease: 'easeInOut',
          }}
        />
      </span>

      <span className="relative inline-flex items-center justify-center min-w-[1.2em] px-1">
        <motion.span
          className="italic font-normal bg-clip-text text-transparent"
          style={{
            backgroundImage:
              'linear-gradient(120deg, hsl(var(--accent)), hsl(var(--electric)), hsl(var(--lime)), hsl(var(--accent)))',
            backgroundSize: '300% 100%',
            WebkitBackgroundClip: 'text',
          }}
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        >
          AI
        </motion.span>
      </span>
    </span>
  )
}
