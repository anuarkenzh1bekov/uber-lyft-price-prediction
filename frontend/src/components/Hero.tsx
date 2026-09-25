import { motion, useReducedMotion } from 'motion/react'
import type { ApiStatus } from '../hooks/useApi'
import { FACTS } from '../lib/facts'

const EASE = [0.16, 1, 0.3, 1] as const

function Words({ text, delay = 0, className }: { text: string; delay?: number; className?: string }) {
  const reduced = useReducedMotion()
  return (
    <span className={className}>
      {text.split(' ').map((word, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.1em] align-bottom">
          <motion.span
            className="inline-block"
            initial={reduced ? false : { y: '105%' }}
            animate={{ y: '0%' }}
            transition={{ duration: 1, ease: EASE, delay: delay + i * 0.06 }}
          >
            {word}
            {' '}
          </motion.span>
        </span>
      ))}
    </span>
  )
}

const STATUS_COPY: Record<ApiStatus, { label: string; tone: string }> = {
  checking: { label: 'Connecting', tone: 'var(--color-faint)' },
  online: { label: 'Model online', tone: 'var(--color-calm)' },
  offline: { label: 'API offline', tone: 'var(--color-surge)' },
}

function StatusPill({ status }: { status: ApiStatus }) {
  const { label, tone } = STATUS_COPY[status]
  return (
    <span
      role="status"
      className="inline-flex h-9 items-center gap-2 rounded-full bg-paper px-4 text-[13px] font-medium text-ink"
    >
      <span className="relative flex size-1.5">
        {status === 'online' && (
          <span
            className="absolute inset-0 rounded-full motion-safe:animate-[ping-soft_1.8s_ease-out_infinite]"
            style={{ background: tone }}
          />
        )}
        <span className="relative size-1.5 rounded-full" style={{ background: tone }} />
      </span>
      {label}
    </span>
  )
}

function Mark() {
  // A → B route glyph
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <circle cx="5" cy="19" r="2.6" fill="currentColor" />
      <circle cx="19" cy="5" r="2.6" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M5 16V11a3 3 0 0 1 3-3h8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function Nav({ status }: { status: ApiStatus }) {
  const links = [
    ['Estimate', '#top'],
    ['Compare', '#compare'],
    ['Model', '#model'],
  ]
  return (
    <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-4 p-4 sm:p-6">
      <a href="#top" className="flex items-center gap-2 text-[15px] font-medium tracking-[-0.02em]">
        <Mark />
        fare radar
      </a>
      <nav
        aria-label="Sections"
        className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full border border-line bg-ink/40 p-1 backdrop-blur-md md:flex"
      >
        {links.map(([label, href]) => (
          <a
            key={href}
            href={href}
            className="rounded-full px-4 py-1.5 text-[13px] text-dim transition-colors hover:bg-white/10 hover:text-paper"
          >
            {label}
          </a>
        ))}
      </nav>
      <StatusPill status={status} />
    </header>
  )
}

export function Headline({ tone }: { tone: string }) {
  const notes = [
    ['Boston, MA', `${FACTS.neighborhoods.length} neighborhoods`],
    ['Uber + Lyft', `${FACTS.pricedRides.toLocaleString('en-US')} priced rides`],
    ['Linear regression', `R² ${FACTS.r2.toFixed(2)} on the test set`],
  ]
  return (
    <div>
      <motion.dl
        className="flex flex-wrap gap-x-10 gap-y-3 text-[12px] leading-tight"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.7 }}
      >
        {notes.map(([k, v]) => (
          <div key={k}>
            <dt className="text-paper">{k}</dt>
            <dd className="text-dim">{v}</dd>
          </div>
        ))}
      </motion.dl>
      <h1 className="mt-5 text-[clamp(3rem,8.2vw,8.5rem)] leading-[0.88] font-normal tracking-[-0.065em]">
        <span className="block">
          <Words text="Know the" />
          <span className="inline-block overflow-hidden pb-[0.1em] align-bottom">
            <motion.span
              className="inline-block transition-colors duration-500"
              style={{ color: tone }}
              initial={{ y: '105%' }}
              animate={{ y: '0%' }}
              transition={{ duration: 1, ease: EASE, delay: 0.12 }}
            >
              fare
            </motion.span>
          </span>
        </span>
        <Words text="before you ride." delay={0.2} className="block text-paper/35" />
      </h1>
    </div>
  )
}
