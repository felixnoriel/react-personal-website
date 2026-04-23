import { motion } from 'framer-motion'
import { Banknote, Globe2, Send, Zap } from 'lucide-react'

const PANELS = [
  {
    icon: Banknote,
    headline: 'USDT Made Easy',
    sub: 'Hold, spend, and send stablecoins like cash.',
    accent: 'from-lime/30 to-lime/5',
    dot: 'bg-lime',
    amount: '$1,240.00',
    ticker: 'USDT · stable',
  },
  {
    icon: Send,
    headline: 'Send & Receive',
    sub: 'Move money in seconds — no waits, no limits.',
    accent: 'from-accent/35 to-accent/5',
    dot: 'bg-accent',
    amount: '$320.00',
    ticker: '→ friend.eth',
  },
  {
    icon: Zap,
    headline: 'Zero Fees',
    sub: 'Keep 100% of every dollar you move.',
    accent: 'from-amber/25 to-amber/5',
    dot: 'bg-amber',
    amount: '$0.00',
    ticker: 'network fee',
  },
  {
    icon: Globe2,
    headline: 'No Borders',
    sub: 'Works everywhere you do — 140+ countries.',
    accent: 'from-electric/30 to-electric/5',
    dot: 'bg-electric',
    amount: '140+',
    ticker: 'countries live',
  },
]

interface StablePayBannerProps {
  className?: string
}

export function StablePayBanner({ className = '' }: StablePayBannerProps) {
  return (
    <div
      className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-[hsl(79_58%_88%)] via-[hsl(79_48%_78%)] to-[hsl(79_42%_68%)] p-5 md:p-8 ${className}`}
    >
      {/* ambient glows */}
      <div
        aria-hidden
        className="absolute -top-16 -right-16 w-72 h-72 rounded-full blur-3xl opacity-70"
        style={{
          background:
            'radial-gradient(circle, hsl(var(--accent) / 0.22), transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="absolute -bottom-20 -left-10 w-80 h-80 rounded-full blur-3xl opacity-60"
        style={{
          background:
            'radial-gradient(circle, hsl(var(--electric) / 0.18), transparent 70%)',
        }}
      />
      {/* faint grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--ink) / 0.07) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--ink) / 0.07) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Header chip */}
      <div className="relative z-10 flex items-center justify-between mb-5 md:mb-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur border border-border text-[10px] tracking-[0.18em] uppercase font-mono text-ink">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-lime opacity-75 animate-ping" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
          </span>
          StablePay · v1
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-ink/70">
          <span className="tabular-nums">USDT</span>
          <span className="text-ink/40">/</span>
          <span className="tabular-nums">1.00 USD</span>
        </div>
      </div>

      {/* 2x2 panel grid */}
      <div className="relative z-10 grid grid-cols-2 gap-3 md:gap-4">
        {PANELS.map((p, i) => {
          const Icon = p.icon
          return (
            <motion.div
              key={p.headline}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{
                duration: 0.5,
                delay: i * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={`relative overflow-hidden rounded-xl border border-border bg-background/70 backdrop-blur-sm p-3 md:p-4 shadow-sm`}
            >
              <div
                aria-hidden
                className={`absolute inset-0 bg-gradient-to-br ${p.accent} opacity-80 pointer-events-none`}
              />
              <div className="relative flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                    <span className="text-[9px] tracking-[0.18em] uppercase font-mono text-ink/70 truncate">
                      {p.ticker}
                    </span>
                  </div>
                  <div className="font-display text-sm md:text-base font-normal tracking-tight text-ink leading-tight mb-0.5 truncate">
                    {p.headline}
                  </div>
                  <div className="text-[10px] md:text-[11px] text-ink-muted leading-snug line-clamp-2">
                    {p.sub}
                  </div>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span className="w-7 h-7 rounded-lg bg-background/80 border border-border flex items-center justify-center text-ink">
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  <span className="font-mono text-[10px] md:text-[11px] font-medium text-ink tabular-nums whitespace-nowrap">
                    {p.amount}
                  </span>
                </div>
              </div>
              {/* shimmer sweep */}
              <motion.span
                aria-hidden
                className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-background/40 to-transparent pointer-events-none"
                initial={{ x: '-120%' }}
                animate={{ x: '220%' }}
                transition={{
                  duration: 2.8,
                  delay: 1.2 + i * 0.25,
                  repeat: Infinity,
                  repeatDelay: 6,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>
          )
        })}
      </div>

      {/* bottom tagline */}
      <div className="relative z-10 mt-5 md:mt-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] md:text-xs font-mono text-ink/80">
          <span className="h-px w-6 bg-ink/30" />
          <span>send money like a message</span>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          {['iOS', 'Android'].map((p) => (
            <span
              key={p}
              className="px-2 py-0.5 rounded-full bg-background/70 border border-border text-[10px] font-mono text-ink"
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
