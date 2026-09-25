import { useEffect } from 'react'
import { motion, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { FACTS } from '../lib/facts'
import { BRAND_LOGO_ON_LIGHT, formatPrice, rideMeta } from '../lib/rides'

interface Props {
  price: number | undefined
  loading: boolean
  ride: string
}

/** The inverted (paper) cell of the control dock: the number everything else feeds. */
export function EstimateCell({ price, loading, ride }: Props) {
  const reduced = useReducedMotion()
  const spring = useSpring(price ?? 0, { stiffness: 110, damping: 22, mass: 0.8 })
  const text = useTransform(spring, (v) => v.toFixed(2))
  const meta = rideMeta(ride)

  useEffect(() => {
    if (price === undefined) return
    if (reduced) spring.jump(price)
    else spring.set(price)
  }, [price, reduced, spring])

  return (
    <div className="flex h-full flex-col justify-between gap-6 bg-paper p-5 text-ink sm:p-6">
      <div className="flex items-center justify-between gap-3 text-[13px]">
        <span className="inline-flex items-center gap-2 text-ink/60">
          <img src={BRAND_LOGO_ON_LIGHT[meta.brand]} alt="" className="h-2.5 w-auto" />
          {ride} estimate
        </span>
        <span className="font-mono text-[11px] text-ink/45">{loading ? 'updating…' : 'live'}</span>
      </div>
      <div>
        <div
          className="flex items-start leading-none font-light tracking-[-0.06em] tabular-nums transition-opacity duration-300"
          style={{ opacity: loading && price !== undefined ? 0.5 : 1 }}
        >
          <span className="mt-[0.12em] mr-0.5 text-[clamp(1.6rem,2.4vw,2.2rem)] text-ink/45">$</span>
          {price === undefined ? (
            <span className="text-[clamp(3.6rem,6vw,5.5rem)] text-ink/20">––.––</span>
          ) : (
            <motion.span className="text-[clamp(3.6rem,6vw,5.5rem)]">{text}</motion.span>
          )}
        </div>
        <p className="mt-2 text-[12px] text-ink/55">Typical model error ±${FACTS.rmse.toFixed(2)}</p>
      </div>
      <p className="sr-only" aria-live="polite">
        {price !== undefined ? `${ride} fare: ${formatPrice(price)}` : ''}
      </p>
    </div>
  )
}
