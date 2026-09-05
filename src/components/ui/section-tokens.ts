// Shared design tokens for the homepage section system. Kept in a
// component-free module so section.tsx can export only components
// (keeps React Fast Refresh working).

export type Accent = 'accent' | 'lime' | 'electric' | 'amber'

export const ACCENT: Record<
  Accent,
  { text: string; bg: string; soft: string; border: string; ring: string; hsl: string }
> = {
  accent: {
    text: 'text-accent',
    bg: 'bg-accent',
    soft: 'bg-accent/10',
    border: 'border-accent/30',
    ring: 'ring-accent/30',
    hsl: 'var(--accent)',
  },
  lime: {
    text: 'text-lime',
    bg: 'bg-lime',
    soft: 'bg-lime/15',
    border: 'border-lime/30',
    ring: 'ring-lime/30',
    hsl: 'var(--lime)',
  },
  electric: {
    text: 'text-electric',
    bg: 'bg-electric',
    soft: 'bg-electric/10',
    border: 'border-electric/30',
    ring: 'ring-electric/30',
    hsl: 'var(--electric)',
  },
  amber: {
    text: 'text-amber',
    bg: 'bg-amber',
    soft: 'bg-amber/10',
    border: 'border-amber/30',
    ring: 'ring-amber/30',
    hsl: 'var(--amber)',
  },
}

export const EASE = [0.22, 1, 0.36, 1] as const
