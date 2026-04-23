import { useEffect, useState, useRef } from 'react'

type CommandLine = {
  prompt: string
  command: string
  output: { text: string; className?: string }[]
}

const COMMANDS: CommandLine[] = [
  {
    prompt: '$',
    command: 'whoami',
    output: [
      { text: 'Felix Noriel', className: 'text-ink' },
      { text: '› Product Engineer · Co-founder', className: 'text-accent' },
    ],
  },
  {
    prompt: '$',
    command: 'cat now.txt',
    output: [
      { text: '› shipping at', className: 'text-ink' },
      { text: '  Stable · StablePay (remote, Asia)', className: 'text-lime' },
      { text: '› building', className: 'text-ink' },
      { text: '  Dashify · hospitality SaaS', className: 'text-electric' },
    ],
  },
  {
    prompt: '$',
    command: 'ls ~/stack',
    output: [
      { text: 'typescript  react  react-native', className: 'text-ink' },
      { text: 'golang      node   postgres  aws', className: 'text-ink' },
      { text: '› 13+ years, 12 countries, still curious', className: 'text-accent' },
    ],
  },
]

const TYPE_SPEED = 55
const OUTPUT_DELAY = 140
const LINGER_MS = 1000
const CLEAR_DELAY = 600

interface TerminalAnimationProps {
  className?: string
}

export function TerminalAnimation({ className = '' }: TerminalAnimationProps) {
  const [cmdIdx, setCmdIdx] = useState(0)
  const [typed, setTyped] = useState('')
  const [outputLines, setOutputLines] = useState<number>(0)
  const [phase, setPhase] = useState<'typing' | 'output' | 'linger' | 'clear'>('typing')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const current = COMMANDS[cmdIdx]

    if (phase === 'typing') {
      if (typed.length < current.command.length) {
        timeoutRef.current = setTimeout(() => {
          setTyped(current.command.slice(0, typed.length + 1))
        }, TYPE_SPEED + Math.random() * 30)
      } else {
        timeoutRef.current = setTimeout(() => {
          setPhase('output')
        }, OUTPUT_DELAY)
      }
    } else if (phase === 'output') {
      if (outputLines < current.output.length) {
        timeoutRef.current = setTimeout(() => {
          setOutputLines((n) => n + 1)
        }, OUTPUT_DELAY)
      } else {
        timeoutRef.current = setTimeout(() => {
          setPhase('linger')
        }, LINGER_MS)
      }
    } else if (phase === 'linger') {
      timeoutRef.current = setTimeout(() => {
        setPhase('clear')
      }, CLEAR_DELAY)
    } else if (phase === 'clear') {
      setTyped('')
      setOutputLines(0)
      setCmdIdx((i) => (i + 1) % COMMANDS.length)
      setPhase('typing')
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [cmdIdx, typed, outputLines, phase])

  const current = COMMANDS[cmdIdx]
  const isTyping = phase === 'typing'

  return (
    <div
      className={`rounded-2xl border border-border bg-surface/60 backdrop-blur-sm p-4 font-mono text-xs shadow-[0_8px_32px_-12px_hsl(var(--ink)/0.12)] ${className}`}
    >
      <div className="flex items-center gap-1.5 mb-3 pb-3 border-b border-border">
        <span className="w-2.5 h-2.5 rounded-full bg-accent/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-lime/80" />
        <span className="ml-2 text-ink-soft text-[10px]">~/felix/about</span>
        <span className="ml-auto text-ink-soft text-[10px] tabular-nums">
          {String(cmdIdx + 1).padStart(2, '0')}/{String(COMMANDS.length).padStart(2, '0')}
        </span>
      </div>

      <div className="space-y-1.5 min-h-[160px]">
        <div className="flex items-center gap-1.5">
          <span className="text-ink-soft">{current.prompt}</span>
          <span className="text-ink">{typed}</span>
          {isTyping && <span className="w-1.5 h-3.5 bg-ink animate-blink ml-0.5" />}
        </div>

        {current.output.slice(0, outputLines).map((line, i) => (
          <div
            key={`${cmdIdx}-${i}`}
            className={`pl-3 leading-relaxed animate-[fadeIn_0.3s_ease-out] ${line.className || 'text-ink-muted'}`}
          >
            {line.text}
          </div>
        ))}

        {phase === 'linger' || phase === 'clear' ? (
          <div className="flex items-center gap-1 text-ink-soft pt-1">
            <span>$</span>
            <span className="w-1.5 h-3.5 bg-ink animate-blink" />
          </div>
        ) : null}
      </div>
    </div>
  )
}
