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

// Brightened brand accents tuned for the dark console (the light-mode brand
// vars are too dark to read on near-black). c = solid, soft = fill, glow =
// box-shadow color, edge = hairline border.
type FxAccent = { c: string; soft: string; glow: string; edge: string }
const ACCENTS: Record<'accent' | 'electric' | 'lime' | 'amber', FxAccent> = {
  accent: { c: 'hsl(322 90% 74%)', soft: 'hsl(322 82% 58% / 0.16)', glow: 'hsl(322 85% 62% / 0.55)', edge: 'hsl(322 84% 66% / 0.45)' },
  electric: { c: 'hsl(214 94% 76%)', soft: 'hsl(214 86% 58% / 0.16)', glow: 'hsl(214 90% 64% / 0.55)', edge: 'hsl(214 90% 68% / 0.45)' },
  lime: { c: 'hsl(79 78% 66%)', soft: 'hsl(79 72% 50% / 0.18)', glow: 'hsl(79 74% 54% / 0.5)', edge: 'hsl(79 74% 58% / 0.4)' },
  amber: { c: 'hsl(40 96% 69%)', soft: 'hsl(40 92% 55% / 0.16)', glow: 'hsl(40 92% 58% / 0.5)', edge: 'hsl(40 94% 62% / 0.42)' },
}
const GROUP_ACCENT: Record<GroupName, FxAccent> = {
  Navigate: ACCENTS.electric,
  'Jump to': ACCENTS.lime,
  Contact: ACCENTS.amber,
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
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

  // open/close + the ⌘K and Escape shortcuts are owned by App (so the palette
  // can be a lazy chunk that only loads on first open).
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
    onClose()
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
          {/* Backdrop — heavy blur darkens the page (shader bleeds through) with
              a soft accent bloom up top */}
          <motion.div
            aria-hidden
            className="absolute inset-0 backdrop-blur-xl"
            onClick={onClose}
            style={{
              background: 'hsl(253 52% 4% / 0.62)',
              backgroundImage:
                'radial-gradient(120% 70% at 50% 8%, hsl(322 80% 48% / 0.18) 0%, transparent 55%)',
            }}
          />

          {/* Console shell — dark frosted glass over the shader */}
          <motion.div
            role="dialog"
            aria-label="Command palette"
            initial={{ opacity: 0, y: -14, scale: 0.97, rotateX: -6 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{
              perspective: '1200px',
              background:
                'radial-gradient(135% 115% at 50% 0%, hsl(253 40% 15% / 0.9), hsl(253 52% 6% / 0.94) 72%)',
              backdropFilter: 'blur(22px)',
              WebkitBackdropFilter: 'blur(22px)',
              boxShadow:
                '0 44px 100px -28px hsl(253 70% 2% / 0.88), inset 0 1px 0 0 hsl(0 0% 100% / 0.07), 0 0 0 1px hsl(0 0% 100% / 0.06), 0 0 70px -12px hsl(322 80% 48% / 0.3)',
            }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl"
          >
            {/* faint starfield texture — ties to the tech constellation */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-50"
              style={{
                backgroundImage:
                  'radial-gradient(hsl(0 0% 100% / 0.14) 0.5px, transparent 0.6px)',
                backgroundSize: '22px 22px',
              }}
            />
            {/* Corner HUD brackets */}
            <ConsoleCorners />

            {/* Animated scan line at the top edge */}
            <div aria-hidden className="absolute inset-x-0 top-0 h-[2px] overflow-hidden">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, hsl(322 88% 68% / 0.8), transparent)',
                }}
              />
              <motion.div
                className="absolute top-0 bottom-0 w-[30%]"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, hsl(79 80% 64%) 50%, transparent 100%)',
                  boxShadow: '0 0 12px hsl(79 80% 60% / 0.9)',
                }}
                animate={{ left: ['-30%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              />
            </div>

            {/* Header — meta strip */}
            <div className="relative flex items-center justify-between px-4 pt-3 pb-1.5 text-[9.5px] font-mono tracking-[0.22em] uppercase text-white/40">
              <div className="flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span
                    className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
                    style={{ background: ACCENTS.lime.c }}
                  />
                  <span
                    className="relative inline-flex h-1.5 w-1.5 rounded-full"
                    style={{ background: ACCENTS.lime.c }}
                  />
                </span>
                <span className="font-semibold tracking-[0.26em] text-white/85">FX.CONSOLE</span>
                <span className="text-white/25">/</span>
                <span>v2.0</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="tabular-nums">{clock}</span>
                <span className="text-white/25">·</span>
                <span>⌘K</span>
              </div>
            </div>

            {/* Search row */}
            <div className="relative flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.07]">
              <span className="flex items-center gap-2 shrink-0">
                <Search className="w-4 h-4" style={{ color: ACCENTS.accent.c }} />
                <span className="font-mono text-sm select-none" style={{ color: ACCENTS.lime.c }}>
                  &gt;
                </span>
              </span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="jump anywhere — projects, career, contact…"
                className="flex-1 bg-transparent outline-none text-[15px] text-white placeholder:text-white/35 font-mono"
                style={{ caretColor: ACCENTS.accent.c }}
                aria-label="Command query"
              />
              <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] text-white/40 tabular-nums">
                <span className="text-white/80">{filtered.length}</span>
                <span className="text-white/25">/</span>
                <span>{commands.length}</span>
              </span>
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded border border-white/15 bg-white/[0.05] text-[10px] font-mono text-white/55">
                ESC
              </kbd>
            </div>

            {/* Filter chips */}
            <div className="relative flex items-center gap-1.5 px-3 pt-2.5 pb-1.5 overflow-x-auto no-scrollbar">
              {(['All', 'Navigate', 'Jump to', 'Contact'] as FilterName[]).map((name) => {
                const isActive = filterGroup === name
                const a = name === 'All' ? ACCENTS.accent : GROUP_ACCENT[name as GroupName]
                return (
                  <button
                    key={name}
                    onClick={() => setFilterGroup(name)}
                    style={
                      isActive
                        ? {
                            color: a.c,
                            background: a.soft,
                            borderColor: a.edge,
                            boxShadow: `0 0 18px -6px ${a.glow}`,
                          }
                        : undefined
                    }
                    className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono text-[11px] tracking-wide transition-all shrink-0 ${
                      isActive
                        ? ''
                        : 'border-white/10 bg-white/[0.03] text-white/55 hover:bg-white/[0.07] hover:text-white/80'
                    }`}
                  >
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{
                        background: a.c,
                        opacity: isActive ? 1 : 0.55,
                        boxShadow: isActive ? `0 0 7px ${a.c}` : undefined,
                      }}
                    />
                    <span className="lowercase">{name}</span>
                    <span
                      className="text-[10px] tabular-nums px-1 rounded-sm"
                      style={{
                        background: isActive ? 'hsl(0 0% 100% / 0.1)' : 'hsl(0 0% 100% / 0.05)',
                        color: isActive ? '#fff' : 'hsl(0 0% 100% / 0.5)',
                      }}
                    >
                      {groupCounts[name]}
                    </span>
                  </button>
                )
              })}
              <span className="ml-auto hidden md:inline-flex items-center gap-1 font-mono text-[9.5px] text-white/35 tracking-wider uppercase">
                <kbd className="inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded border border-white/12 bg-white/[0.04] text-white/55 text-[9px]">
                  tab
                </kbd>
                <span>cycle</span>
              </span>
            </div>

            {/* Results */}
            <div className="relative max-h-[50vh] overflow-y-auto pt-1 pb-2">
              {filtered.length === 0 ? (
                <EmptyState query={query} />
              ) : (
                Object.entries(grouped).map(([group, items]) => {
                  const a = GROUP_ACCENT[group as GroupName]
                  return (
                    <div key={group} className="px-2 pb-2">
                      <div className="flex items-center gap-2 px-3 pt-2 pb-1.5">
                        <span
                          className="inline-block w-1 h-3 rounded-sm"
                          style={{ background: a.c, boxShadow: `0 0 8px ${a.glow}` }}
                        />
                        <span className="text-[10px] tracking-[0.28em] uppercase text-white/45 font-mono">
                          {group}
                        </span>
                        <span className="flex-1 h-px bg-gradient-to-r from-white/15 to-transparent" />
                        <span className="text-[9.5px] font-mono text-white/35 tabular-nums">
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
                              transition={{ duration: 0.2, delay: 0.02 * itemIdx }}
                            >
                              <CommandRow
                                item={item}
                                isActive={isActive}
                                query={query}
                                accent={a}
                                onHover={() => setActiveIndex(localIndex)}
                                onActivate={() => {
                                  item.action()
                                  onClose()
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
            <div className="relative flex items-center justify-between gap-4 px-4 py-2.5 border-t border-white/[0.07] bg-[hsl(253_50%_4%/0.4)] text-[11px] font-mono text-white/45">
              <div className="flex items-center gap-3">
                <Shortcut keys={['↑', '↓']} label="navigate" />
                <Shortcut keys={[<CornerDownLeft key="enter" className="w-3 h-3" />]} label="open" />
                <Shortcut keys={['esc']} label="close" />
              </div>
              <div className="flex items-center gap-2.5">
                <Heartbeat />
                <span className="text-white/25">·</span>
                <span>
                  <span className="text-white/85 tabular-nums">{filtered.length}</span> result
                  {filtered.length === 1 ? '' : 's'}
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
// CommandRow — one result row with active glow + match highlight
// ════════════════════════════════════════════════════════════
function CommandRow({
  item,
  isActive,
  query,
  accent,
  onHover,
  onActivate,
}: {
  item: CommandItem
  isActive: boolean
  query: string
  accent: FxAccent
  onHover: () => void
  onActivate: () => void
}) {
  const Icon = item.icon
  return (
    <button
      onMouseEnter={onHover}
      onClick={onActivate}
      className="relative w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-left overflow-hidden"
      style={
        isActive
          ? { background: `linear-gradient(90deg, ${accent.soft}, transparent 88%)` }
          : undefined
      }
    >
      {/* hover wash on inactive rows */}
      {!isActive && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-xl bg-white/[0.04] opacity-0 group-hover:opacity-100 transition-opacity"
        />
      )}

      {/* left glow bar, lit when active */}
      <span
        aria-hidden
        className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-sm transition-all"
        style={isActive ? { background: accent.c, boxShadow: `0 0 12px ${accent.glow}` } : undefined}
      />

      {/* Shimmer sweep on active row */}
      {isActive && (
        <motion.span
          aria-hidden
          className="absolute inset-y-0 w-[55%] pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${accent.soft} 50%, transparent 100%)`,
          }}
          initial={{ left: '-55%' }}
          animate={{ left: '100%' }}
          transition={{ duration: 1.9, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Icon badge */}
      <span
        className="relative z-[1] flex items-center justify-center w-7 h-7 rounded-lg border transition-colors"
        style={
          isActive
            ? { color: accent.c, background: accent.soft, borderColor: accent.edge }
            : {
                color: 'hsl(0 0% 100% / 0.5)',
                background: 'hsl(0 0% 100% / 0.03)',
                borderColor: 'hsl(0 0% 100% / 0.1)',
              }
        }
      >
        <Icon className="w-3.5 h-3.5" />
        {isActive && (
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-lg"
            style={{ background: accent.c, filter: 'blur(7px)' }}
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: [0, 0.35, 0], scale: [1, 1.4, 1.4] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
      </span>

      {/* Label + match highlight */}
      <span
        className="relative z-[1] flex-1 text-[14px] truncate"
        style={{ color: isActive ? '#fff' : 'hsl(0 0% 100% / 0.82)' }}
      >
        <HighlightMatch text={item.label} query={query} />
      </span>

      {/* Hint (path / email) */}
      {item.hint && (
        <span
          className="relative z-[1] hidden sm:inline-block text-[11px] font-mono tabular-nums transition-colors"
          style={{ color: isActive ? accent.c : 'hsl(0 0% 100% / 0.4)' }}
        >
          {item.hint}
        </span>
      )}

      {/* Right arrow */}
      <motion.span
        className="relative z-[1] inline-flex items-center justify-center"
        animate={isActive ? { x: [0, 3, 0] } : { x: 0 }}
        transition={{ duration: 1.2, repeat: isActive ? Infinity : 0, ease: 'easeInOut' }}
      >
        <ArrowRight
          className={`w-3.5 h-3.5 transition-opacity ${isActive ? '' : 'opacity-0 group-hover:opacity-70'}`}
          style={{ color: isActive ? accent.c : 'hsl(0 0% 100% / 0.5)' }}
        />
      </motion.span>
    </button>
  )
}

// ════════════════════════════════════════════════════════════
// HighlightMatch — highlights each query token inside the label
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
            className="font-semibold rounded-sm px-[1.5px]"
            style={{ color: ACCENTS.accent.c, background: 'hsl(322 80% 60% / 0.2)' }}
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
// EmptyState — "no signal" panel
// ════════════════════════════════════════════════════════════
function EmptyState({ query }: { query: string }) {
  return (
    <div className="px-6 py-9 text-center font-mono">
      <div className="relative inline-block mb-3">
        <motion.div
          className="text-[11px] tracking-[0.35em] uppercase text-white/40"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          ▚ NO SIGNAL ▚
        </motion.div>
      </div>
      <div className="text-sm text-white/70 mb-1">
        No results for <span className="text-white">&quot;{query || '…'}&quot;</span>
      </div>
      <div className="text-[11px] text-white/45">
        try{' '}
        <span style={{ color: ACCENTS.electric.c }}>projects</span>,{' '}
        <span style={{ color: ACCENTS.lime.c }}>career</span>, or{' '}
        <span style={{ color: ACCENTS.amber.c }}>contact</span>
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
          className={`absolute ${x.cls}`}
          style={{ color: 'hsl(322 84% 68% / 0.7)' }}
        >
          <path d={x.d} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
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
    <span
      className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase"
      style={{ color: ACCENTS.lime.c }}
    >
      <svg width="28" height="10" viewBox="0 0 28 10">
        <polyline
          points="0,5 6,5 9,1 12,9 15,5 28,5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: 'drop-shadow(0 0 3px hsl(79 80% 56% / 0.9))' }}
        >
          <animate attributeName="stroke-dashoffset" from="0" to="-28" dur="1.5s" repeatCount="indefinite" />
        </polyline>
      </svg>
      <span>online</span>
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
          className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded border border-white/12 bg-white/[0.05] text-white/60 text-[10px]"
        >
          {k}
        </kbd>
      ))}
      <span className="ml-1 text-white/45">{label}</span>
    </span>
  )
}
