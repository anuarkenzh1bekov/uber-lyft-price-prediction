import { motion } from 'motion/react'
import { numberWord } from '../lib/facts'
import { BRAND_LOGO, rideMeta } from '../lib/rides'

interface Props {
  types: string[]
  prices: Record<string, number>
  selected: string
  onSelect: (name: string) => void
  distance: number
  surge: number
}

export function SectionTag({ index, children }: { index: string; children: string }) {
  return (
    <p className="flex items-center gap-3 text-[13px] text-dim">
      <span className="font-mono text-faint">{index}</span>
      <span className="h-px w-8 bg-line" />
      {children}
    </p>
  )
}

export function CompareChart({ types, prices, selected, onSelect, distance, surge }: Props) {
  const rows = types
    .filter((t) => prices[t] !== undefined)
    .map((t) => ({ name: t, price: prices[t] }))
    .sort((a, b) => a.price - b.price)
  const max = Math.max(...rows.map((r) => r.price), 1)
  const low = rows[0]
  const high = rows[rows.length - 1]

  return (
    <section id="compare" aria-labelledby="compare-title" className="mx-auto max-w-[1400px] scroll-mt-6 px-4 py-24 sm:px-8 lg:py-36">
      <div className="grid gap-16 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-24">
        <div className="lg:sticky lg:top-10 lg:self-start">
          <SectionTag index="02">Compare</SectionTag>
          <h2
            id="compare-title"
            className="mt-8 text-[clamp(2.6rem,5.2vw,4.75rem)] leading-[0.92] font-normal tracking-[-0.055em]"
          >
            Same trip.
            <br />
            <span className="text-paper/35">{numberWord(types.length)} prices.</span>
          </h2>
          <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-dim">
            Every ride type priced for {distance.toFixed(2)} mi at ×{surge.toFixed(2)} demand. Pick a row to put it on
            the map.
          </p>

          {low && high && (
            <dl className="mt-14 grid grid-cols-3 gap-6 border-t border-line pt-6">
              <div>
                <dt className="text-[12px] text-dim">Cheapest</dt>
                <dd className="mt-2 text-[clamp(1.6rem,2.4vw,2.2rem)] leading-none font-light tracking-[-0.04em] tabular-nums">
                  ${low.price.toFixed(2)}
                </dd>
                <dd className="mt-1.5 text-[12px] text-faint">{low.name}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-dim">Priciest</dt>
                <dd className="mt-2 text-[clamp(1.6rem,2.4vw,2.2rem)] leading-none font-light tracking-[-0.04em] tabular-nums">
                  ${high.price.toFixed(2)}
                </dd>
                <dd className="mt-1.5 text-[12px] text-faint">{high.name}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-dim">Spread</dt>
                <dd className="mt-2 text-[clamp(1.6rem,2.4vw,2.2rem)] leading-none font-light tracking-[-0.04em] tabular-nums">
                  {low.price > 0 ? `×${(high.price / low.price).toFixed(1)}` : '—'}
                </dd>
                <dd className="mt-1.5 text-[12px] text-faint">top vs. bottom</dd>
              </div>
            </dl>
          )}
        </div>

        {rows.length === 0 ? (
          <div className="space-y-px" aria-hidden>
            {types.map((t) => (
              <div key={t} className="shimmer h-[84px]" />
            ))}
          </div>
        ) : (
          <ol className="border-t border-line">
            {rows.map(({ name, price }, i) => {
              const meta = rideMeta(name)
              const active = name === selected
              return (
                <motion.li
                  key={name}
                  layout
                  transition={{ type: 'spring', stiffness: 300, damping: 34 }}
                  className="border-b border-line"
                >
                  <button
                    type="button"
                    onClick={() => onSelect(name)}
                    aria-pressed={active}
                    className="group grid w-full grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-x-4 py-5 text-left sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:gap-x-6"
                  >
                    <span className="font-mono text-[12px] text-faint tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-2.5">
                        <span
                          className={`truncate text-[17px] tracking-[-0.02em] transition-colors ${active ? 'text-paper' : 'text-dim group-hover:text-paper'}`}
                        >
                          {name}
                        </span>
                        <img src={BRAND_LOGO[meta.brand]} alt="" className="h-2.5 w-auto opacity-60" />
                        <span className="hidden text-[12px] text-faint sm:inline">{meta.tier}</span>
                      </span>
                      <span className="mt-3 block h-px bg-line">
                        <motion.span
                          className="block h-px"
                          style={{ background: active ? 'var(--color-paper)' : 'var(--color-faint)' }}
                          initial={false}
                          animate={{ width: `${Math.max(price / max, 0) * 100}%` }}
                          transition={{ type: 'spring', stiffness: 140, damping: 24 }}
                        />
                      </span>
                    </span>
                    <span
                      className={`text-[clamp(1.6rem,2.6vw,2.4rem)] leading-none font-light tracking-[-0.05em] tabular-nums transition-colors ${active ? 'text-paper' : 'text-dim group-hover:text-paper'}`}
                    >
                      ${price.toFixed(2)}
                    </span>
                  </button>
                </motion.li>
              )
            })}
          </ol>
        )}
      </div>
    </section>
  )
}
