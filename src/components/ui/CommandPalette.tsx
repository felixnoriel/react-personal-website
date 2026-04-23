import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  Briefcase,
  CornerDownLeft,
  FileText,
  FolderGit2,
  Home,
  Mail,
  Search,
  Sparkles,
  User,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

type GroupName = 'Navigate' | 'Jump to' | 'Contact'
type FilterName = 'All' | GroupName

type CommandItem = {
  id: string
  label: string
  hint?: string
  group: GroupName
  icon: LucideIcon
  keywords?: string[]
  action: () => void
}

// Group → accent color mapping (CSS custom properties / tokens)
const GROUP_COLOR: Record<GroupName, { dot: string; glow: string; text: string; bg: string; border: string }> = {
  Navigate: {
    dot: 'bg-electric',
    glow: 'shadow-[0_0_8px_hsl(var(--electric)/0.7)]',
    text: 'text-electric',
    bg: 'bg-electric/10',
    border: 'border-electric/50',
  },
  'Jump to': {
    dot: 'bg-lime',
    glow: 'shadow-[0_0_8px_hsl(var(--lime)/0.7)]',
    text: 'text-lime',
    bg: 'bg-lime/10',
    border: 'border-lime/50',
  },
  Contact: {
    dot: 'bg-amber',
    glow: 'shadow-[0_0_8px_hsl(var(--amber)/0.7)]',
    text: 'text-amber',
    bg: 'bg-amber/10',
    border: 'border-amber/50',
  },
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [filterGroup, setFilterGroup] = useState<FilterName>('All')
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const commands = useMemo<CommandItem[]>(
    () => [
      {
        id: 'nav-home',
        label: 'Home',
        hint: '/',
        group: 'Navigate',
        icon: Home,
        keywords: ['root', 'index'],
        action: () => navigate('/'),
      },
      {
        id: 'nav-projects',
        label: 'Projects',
        hint: '/projects',
        group: 'Navigate',
        icon: FolderGit2,
        keywords: ['work', 'portfolio', 'case studies'],
        action: () => navigate('/projects'),
      },
      {
        id: 'nav-career',
        label: 'Career',
        hint: '/career',
        group: 'Navigate',
        icon: Briefcase,
        keywords: ['experience', 'jobs', 'resume'],
        action: () => navigate('/career'),
      },
      {
        id: 'nav-about',
        label: 'About',
        hint: '/about',
        group: 'Navigate',
        icon: User,
        keywords: ['bio', 'me', 'felix'],
        action: () => navigate('/about'),
      },
      {
        id: 'nav-blog',
        label: 'Blog',
        hint: '/blog',
        group: 'Navigate',
        icon: FileText,
        keywords: ['writing', 'articles', 'posts'],
        action: () => navigate('/blog'),
      },
      {
        id: 'jump-work',
        label: 'Selected work',
        hint: '#projects-section',
        group: 'Jump to',
        icon: Sparkles,
        keywords: ['featured', 'stable', 'genopets', 'dashify'],
        action: () => scrollTo('projects-section'),
      },
      {
        id: 'jump-career',
        label: 'Experience',
        hint: '#career-section',
        group: 'Jump to',
        icon: Briefcase,
        keywords: ['jobs', 'history', 'timeline'],
        action: () => scrollTo('career-section'),
      },
      {
        id: 'jump-skills',
        label: 'Skills',
        hint: '#skills-section',
        group: 'Jump to',
        icon: Sparkles,
        keywords: ['tech', 'stack', 'tools'],
        action: () => scrollTo('skills-section'),
      },
      {
        id: 'jump-contact',
        label: 'Contact',
        hint: '#contact-section',
        group: 'Jump to',
        icon: Mail,
        keywords: ['email', 'reach out', 'get in touch'],
        action: () => scrollTo('contact-section'),
      },
      {
        id: 'contact-email',
        label: 'Send an email',
        hint: 'felix@stable.xyz',
        group: 'Contact',
        icon: Mail,
        keywords: ['hire', 'message', 'hello'],
        action: () => {
          window.location.href = 'mailto:felix@stable.xyz'
        },
      },
    ],
    [navigate],
  )

  // Counts per group (always total, ignores active filter — so chips show full distribution)
  const groupCounts = useMemo(() => {
    const counts: Record<FilterName, number> = {
      All: commands.length,
      Navigate: 0,
      'Jump to': 0,
      Contact: 0,
    }
    commands.forEach((c) => (counts[c.group] += 1))
    return counts
  }, [commands])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let base = commands
    if (filterGroup !== 'All') base = base.filter((c) => c.group === filterGroup)
    if (!q) return base
    return base.filter((c) => {
      const hay = [c.label, c.hint ?? '', c.group, ...(c.keywords ?? [])]
        .join(' ')
        .toLowerCase()
      return q.split(/\s+/).every((token) => hay.includes(token))
    })
  }, [query, commands, filterGroup])

  const grouped = useMemo(() => {
    const g: Record<string, CommandItem[]> = {}
    filtered.forEach((c) => {
      g[c.group] = g[c.group] ? [...g[c.group], c] : [c]
    })
    return g
  }, [filtered])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes('mac')
      const mod = isMac ? e.metaKey : e.ctrlKey
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
        return
      }
      if (e.key === 'Escape' && open) {
        e.preventDefault()
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (open) {
      setActiveIndex(0)
      setQuery('')
      setFilterGroup('All')
      setTimeout(() => inputRef.current?.focus(), 40)
    }
  }, [open])

  useEffect(() => {
    setActiveIndex(0)
  }, [query, filterGroup])

  const runActive = () => {
    const item = filtered[activeIndex]
    if (!item) return
    item.action()
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % Math.max(filtered.length, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(
        (i) => (i - 1 + filtered.length) % Math.max(filtered.length, 1),
      )
    } else if (e.key === 'Enter') {
      e.preventDefault()
      runActive()
    } else if (e.key === 'Tab') {
      // Cycle filters on Tab
      e.preventDefault()
      const order: FilterName[] = ['All', 'Navigate', 'Jump to', 'Contact']
      const idx = order.indexOf(filterGroup)
      setFilterGroup(order[(idx + (e.shiftKey ? -1 : 1) + order.length) % order.length])
    }
  }

  let runningIndex = -1

  // A clock tick for the live status footer
  const [clock, setClock] = useState('')
  useEffect(() => {
    if (!open) return
    const fmt = () => {
      const d = new Date()
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
    }
    setClock(fmt())
    const id = setInterval(() => setClock(fmt()), 1000)
    return () => clearInterval(id)
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="palette"
          className="fixed inset-0 z-[90] flex items-start justify-center pt-[12vh] px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {/* Backdrop */}
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-ink/55 backdrop-blur-md"
            onClick={() => setOpen(false)}
            style={{
              backgroundImage:
                'radial-gradient(circle at 50% 20%, hsl(var(--accent)/0.12) 0%, transparent 50%)',
            }}
          />

          {/* Console shell */}
          <motion.div
            role="dialog"
            aria-label="Command palette"
            initial={{ opacity: 0, y: -14, scale: 0.97, rotateX: -6 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{ perspective: '1200px' }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-accent/30 bg-background/95 shadow-[0_30px_80px_-20px_hsl(var(--accent)/0.35),0_0_0_1px_hsl(var(--accent)/0.1)] backdrop-blur-xl"
          >
            {/* Corner HUD brackets */}
            <ConsoleCorners />

            {/* Animated scan line at the top edge */}
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-[2px] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/70 to-transparent" />
              <motion.div
                className="absolute top-0 bottom-0 w-[30%]"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, hsl(var(--lime)) 50%, transparent 100%)',
                  boxShadow: '0 0 10px hsl(var(--lime) / 0.8)',
                }}
                animate={{ left: ['-30%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              />
            </div>

            {/* Header — tiny meta strip above the input */}
            <div className="flex items-center justify-between px-4 pt-2.5 pb-1 text-[9.5px] font-mono tracking-[0.22em] uppercase text-ink-soft">
              <div className="flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-lime opacity-75 animate-ping" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
                </span>
                <span className="text-ink">FX.CONSOLE</span>
                <span className="text-ink-soft/60">/</span>
                <span>v1.0</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="tabular-nums">{clock}</span>
                <span className="text-ink-soft/60">·</span>
                <span>⌘K</span>
              </div>
            </div>

            {/* Search row */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <span className="flex items-center gap-2 shrink-0">
                <Search className="w-4 h-4 text-accent" />
                <span className="font-mono text-lime text-sm select-none">
                  &gt;
                </span>
              </span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="jump anywhere — projects, career, contact…"
                className="flex-1 bg-transparent outline-none text-sm text-ink placeholder:text-ink-soft font-mono caret-accent"
                aria-label="Command query"
              />
              {/* Trailing: match count tiny chip + ESC */}
              <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] text-ink-soft tabular-nums">
                <span className="text-ink">{filtered.length}</span>
                <span className="text-ink-soft/60">/</span>
                <span>{commands.length}</span>
              </span>
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded border border-border bg-surface text-[10px] font-mono text-ink-muted">
                ESC
              </kbd>
            </div>

            {/* Filter chips */}
            <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-1.5 overflow-x-auto no-scrollbar">
              {(['All', 'Navigate', 'Jump to', 'Contact'] as FilterName[]).map(
                (name) => {
                  const isActive = filterGroup === name
                  const color =
                    name === 'All' ? null : GROUP_COLOR[name as GroupName]
                  return (
                    <button
                      key={name}
                      onClick={() => setFilterGroup(name)}
                      className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono text-[11px] tracking-wide transition-all shrink-0 ${
                        isActive
                          ? color
                            ? `${color.border} ${color.bg} ${color.text}`
                            : 'border-accent/50 bg-accent/10 text-accent'
                          : 'border-border bg-surface text-ink-muted hover:bg-surface/80'
                      }`}
                    >
                      <span
                        className={`inline-block w-1.5 h-1.5 rounded-full ${
                          color ? color.dot : 'bg-accent'
                        } ${isActive ? 'shadow-[0_0_6px_currentColor]' : 'opacity-60'}`}
                      />
                      <span className="lowercase">{name}</span>
                      <span
                        className={`text-[10px] tabular-nums px-1 rounded-sm ${
                          isActive
                            ? 'bg-background/50 text-ink'
                            : 'bg-background/80 text-ink-soft'
                        }`}
                      >
                        {groupCounts[name]}
                      </span>
                    </button>
                  )
                },
              )}
              <span className="ml-auto hidden md:inline-flex items-center gap-1 font-mono text-[9.5px] text-ink-soft/70 tracking-wider uppercase">
                <kbd className="inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded border border-border bg-background text-ink-muted text-[9px]">
                  tab
                </kbd>
                <span>cycle</span>
              </span>
            </div>

            {/* Results */}
            <div className="max-h-[50vh] overflow-y-auto pt-1 pb-2">
              {filtered.length === 0 ? (
                <EmptyState query={query} />
              ) : (
                Object.entries(grouped).map(([group, items]) => {
                  const color = GROUP_COLOR[group as GroupName]
                  return (
                    <div key={group} className="px-2 pb-2">
                      <div className="flex items-center gap-2 px-3 pt-2 pb-1.5">
                        <span
                          className={`inline-block w-1 h-3 rounded-sm ${color.dot} ${color.glow}`}
                        />
                        <span className="text-[10px] tracking-[0.28em] uppercase text-ink-soft font-mono">
                          {group}
                        </span>
                        <span className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
                        <span className="text-[9.5px] font-mono text-ink-soft/70 tabular-nums">
                          {String(items.length).padStart(2, '0')}
                        </span>
                      </div>
                      <ul>
                        {items.map((item, itemIdx) => {
                          runningIndex += 1
                          const isActive = runningIndex === activeIndex
                          const localIndex = runningIndex
                          return (
                            <motion.li
                              key={item.id}
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{
                                duration: 0.2,
                                delay: 0.02 * itemIdx,
                              }}
                            >
                              <CommandRow
                                item={item}
                                isActive={isActive}
                                query={query}
                                color={color}
                                onHover={() => setActiveIndex(localIndex)}
                                onActivate={() => {
                                  item.action()
                                  setOpen(false)
                                }}
                              />
                            </motion.li>
                          )
                        })}
                      </ul>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-4 px-4 py-2.5 border-t border-border bg-surface/60 text-[11px] font-mono text-ink-soft">
              <div className="flex items-center gap-3">
                <Shortcut keys={['↑', '↓']} label="navigate" />
                <Shortcut
                  keys={[
                    <CornerDownLeft key="enter" className="w-3 h-3" />,
                  ]}
                  label="open"
                />
                <Shortcut keys={['esc']} label="close" />
              </div>
              <div className="flex items-center gap-2.5">
                {/* Tiny heartbeat sparkline */}
                <Heartbeat />
                <span className="text-ink-soft/80">·</span>
                <span>
                  <span className="text-ink tabular-nums">
                    {filtered.length}
                  </span>{' '}
                  result{filtered.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ════════════════════════════════════════════════════════════
// CommandRow — one result row with active shimmer + match highlight
// ════════════════════════════════════════════════════════════
function CommandRow({
  item,
  isActive,
  query,
  color,
  onHover,
  onActivate,
}: {
  item: CommandItem
  isActive: boolean
  query: string
  color: (typeof GROUP_COLOR)[GroupName]
  onHover: () => void
  onActivate: () => void
}) {
  const Icon = item.icon
  return (
    <button
      onMouseEnter={onHover}
      onClick={onActivate}
      className={`relative w-full group flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors overflow-hidden ${
        isActive ? color.bg : 'hover:bg-surface'
      }`}
    >
      {/* Left group accent bar, thicker when active */}
      <span
        aria-hidden
        className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-sm transition-all ${
          isActive ? `${color.dot} ${color.glow}` : 'bg-transparent'
        }`}
      />

      {/* Shimmer sweep on active row */}
      {isActive && (
        <motion.span
          aria-hidden
          className="absolute inset-y-0 w-[50%] pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, hsl(var(--lime)/0.08) 50%, transparent 100%)',
          }}
          initial={{ left: '-50%' }}
          animate={{ left: '100%' }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}

      {/* Icon badge */}
      <span
        className={`relative flex items-center justify-center w-7 h-7 rounded-md border transition-colors ${
          isActive
            ? `${color.border} ${color.bg} ${color.text}`
            : 'border-border bg-surface text-ink-muted'
        }`}
      >
        <Icon className="w-3.5 h-3.5" />
        {isActive && (
          <motion.span
            aria-hidden
            className={`absolute inset-0 rounded-md ${color.dot}`}
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: [0, 0.3, 0], scale: [1, 1.35, 1.35] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
            style={{ filter: 'blur(6px)' }}
          />
        )}
      </span>

      {/* Label + match highlight */}
      <span className="flex-1 text-sm text-ink truncate">
        <HighlightMatch text={item.label} query={query} />
      </span>

      {/* Hint (path / email) */}
      {item.hint && (
        <span
          className={`hidden sm:inline-block text-[11px] font-mono transition-colors tabular-nums ${
            isActive ? color.text : 'text-ink-soft'
          }`}
        >
          {item.hint}
        </span>
      )}

      {/* Right arrow with animated translation on active */}
      <motion.span
        className="relative inline-flex items-center justify-center"
        animate={
          isActive
            ? { x: [0, 3, 0] }
            : { x: 0 }
        }
        transition={{
          duration: 1.2,
          repeat: isActive ? Infinity : 0,
          ease: 'easeInOut',
        }}
      >
        <ArrowRight
          className={`w-3.5 h-3.5 transition-opacity ${
            isActive
              ? color.text
              : 'text-ink-soft opacity-0 group-hover:opacity-80'
          }`}
        />
      </motion.span>
    </button>
  )
}

// ════════════════════════════════════════════════════════════
// HighlightMatch — highlights each space-separated query token
// inside the label with an accent color
// ════════════════════════════════════════════════════════════
function HighlightMatch({ text, query }: { text: string; query: string }) {
  const q = query.trim()
  if (!q) return <>{text}</>
  const tokens = q
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  if (tokens.length === 0) return <>{text}</>
  const re = new RegExp(`(${tokens.join('|')})`, 'ig')
  const parts = text.split(re)
  return (
    <>
      {parts.map((p, i) =>
        re.test(p) ? (
          <span
            key={i}
            className="text-accent font-semibold bg-accent/10 rounded-sm px-[1.5px]"
          >
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  )
}

// ════════════════════════════════════════════════════════════
// EmptyState — cool "no signal" panel
// ════════════════════════════════════════════════════════════
function EmptyState({ query }: { query: string }) {
  return (
    <div className="px-6 py-9 text-center font-mono">
      {/* Glitchy NO SIGNAL */}
      <div className="relative inline-block mb-3">
        <motion.div
          className="text-[11px] tracking-[0.35em] uppercase text-ink-soft"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          ▚ NO SIGNAL ▚
        </motion.div>
      </div>
      <div className="text-sm text-ink-muted mb-1">
        No results for{' '}
        <span className="text-ink">&quot;{query || '…'}&quot;</span>
      </div>
      <div className="text-[11px] text-ink-soft">
        try{' '}
        <span className="text-accent">projects</span>,{' '}
        <span className="text-lime">career</span>, or{' '}
        <span className="text-amber">contact</span>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// ConsoleCorners — HUD-style brackets on the modal
// ════════════════════════════════════════════════════════════
function ConsoleCorners() {
  const b = [
    { cls: 'top-1.5 left-1.5', d: 'M 2 10 L 2 2 L 10 2' },
    { cls: 'top-1.5 right-1.5', d: 'M 4 2 L 12 2 L 12 10' },
    { cls: 'bottom-1.5 left-1.5', d: 'M 2 4 L 2 12 L 10 12' },
    { cls: 'bottom-1.5 right-1.5', d: 'M 4 12 L 12 12 L 12 4' },
  ]
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none z-[5]">
      {b.map((x, i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 14 14"
          className={`absolute ${x.cls} text-accent/60`}
        >
          <path
            d={x.d}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      ))}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// Heartbeat — tiny live sparkline "online" indicator
// ════════════════════════════════════════════════════════════
function Heartbeat() {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase text-ink-soft">
      <svg width="28" height="10" viewBox="0 0 28 10" className="text-lime">
        <polyline
          points="0,5 6,5 9,1 12,9 15,5 28,5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: 'drop-shadow(0 0 3px hsl(var(--lime)/0.8))' }}
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-28"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </polyline>
      </svg>
      <span className="text-lime">online</span>
    </span>
  )
}

// ════════════════════════════════════════════════════════════
// Shortcut pill
// ════════════════════════════════════════════════════════════
function Shortcut({
  keys,
  label,
}: {
  keys: Array<string | React.ReactNode>
  label: string
}) {
  return (
    <span className="inline-flex items-center gap-1">
      {keys.map((k, i) => (
        <kbd
          key={i}
          className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded border border-border bg-background text-ink-muted text-[10px]"
        >
          {k}
        </kbd>
      ))}
      <span className="ml-1">{label}</span>
    </span>
  )
}
