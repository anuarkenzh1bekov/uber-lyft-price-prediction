import { Suspense, lazy, useEffect, useState, useSyncExternalStore } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Toaster, toast } from 'sonner'
import { Headline, Nav } from './components/Hero'
import { EstimateCell } from './components/EstimateCell'
import { RangeField } from './components/RangeField'
import { RideTypePicker } from './components/RideTypePicker'
import { CompareChart } from './components/CompareChart'
import { ModelSection } from './components/ModelSection'
import { useHealth, useQuotes, useRideTypes } from './hooks/useApi'
import { API_URL } from './lib/api'
import { MAX_DISTANCE, MILES_TO_KM, heatTone, surgeLabel } from './lib/rides'

const Scene3D = lazy(() => import('./components/Scene3D'))

const EASE = [0.16, 1, 0.3, 1] as const
const RUN_CMD = 'uvicorn app.main:app --reload'

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query)
      mq.addEventListener('change', cb)
      return () => mq.removeEventListener('change', cb)
    },
    () => window.matchMedia(query).matches,
  )
}

function OfflineNotice() {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(RUN_CMD)
      toast.success('Command copied')
    } catch {
      toast.error('Couldn’t copy — select the command manually')
    }
  }
  return (
    <div role="alert" className="mb-6 flex flex-wrap items-center gap-3 text-[13px]">
      <span className="text-dim">
        Can’t reach <span className="font-mono text-paper">{API_URL}</span>. Start the backend from the project root:
      </span>
      <button
        type="button"
        onClick={copy}
        className="rounded-full border border-line bg-ink/60 px-3.5 py-1.5 font-mono text-[12px] text-paper backdrop-blur-md transition-colors hover:border-white/30"
      >
        {RUN_CMD}
      </button>
    </div>
  )
}

export default function App() {
  const status = useHealth()
  const types = useRideTypes(status)
  const [ride, setRide] = useState('UberX')
  const [distance, setDistance] = useState(2.4)
  const [surge, setSurge] = useState(1)
  const quotes = useQuotes(types, distance, surge, status === 'online')

  const reduced = useReducedMotion() ?? false
  const compact = useMediaQuery('(max-width: 1023px)')
  const tone = heatTone(surge)

  useEffect(() => {
    if (!types.includes(ride)) setRide(types[0])
  }, [types, ride])

  useEffect(() => {
    if (quotes.error) toast.error('Couldn’t calculate the price', { id: 'quote-error', description: quotes.error })
  }, [quotes.error])

  return (
    <>
      <div id="top" className="p-2 sm:p-3">
        <section
          aria-label="Fare estimator"
          className="relative isolate overflow-hidden rounded-[28px] bg-ink-2 lg:h-[calc(100svh-24px)] lg:min-h-[760px]"
        >
          <div className="relative z-0 h-[58svh] min-h-[380px] lg:absolute lg:inset-0 lg:h-auto">
            <Suspense fallback={<div className="size-full bg-ink-2" />}>
              <Scene3D distance={distance} surge={surge} reduced={reduced} compact={compact} />
            </Suspense>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink-2 via-ink-2/70 to-transparent lg:h-[62%]" />
          </div>

          <Nav status={status} />

          <div className="relative z-10 -mt-28 px-4 pb-4 sm:px-6 lg:absolute lg:inset-x-0 lg:bottom-0 lg:mt-0 lg:px-8 lg:pb-8">
            {status === 'offline' && <OfflineNotice />}
            <Headline tone={tone} />

            <motion.div
              className="mt-8 max-w-[1400px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: EASE, delay: 0.5 }}
            >
              <RideTypePicker
                types={types}
                selected={ride}
                onSelect={setRide}
                prices={quotes.prices}
                loading={quotes.loading}
              />

              <form
                onSubmit={(e) => e.preventDefault()}
                aria-label="Trip details"
                className="mt-3 grid overflow-hidden rounded-[22px] border border-line bg-ink/75 backdrop-blur-xl md:grid-cols-2 lg:grid-cols-[1fr_1fr_minmax(300px,0.95fr)]"
              >
                <div className="border-b border-line p-5 sm:p-6 md:border-r lg:border-b-0">
                  <RangeField
                    id="distance"
                    label="Distance"
                    hint={`≈ ${(distance * MILES_TO_KM).toFixed(1)} km`}
                    min={0.1}
                    max={MAX_DISTANCE}
                    step={0.05}
                    value={distance}
                    onChange={setDistance}
                    tone="var(--color-paper)"
                    valueText={`${distance.toFixed(2)} miles`}
                    scale={['0.1 mi', `${MAX_DISTANCE} mi`]}
                    display={
                      <>
                        {distance.toFixed(2)}
                        <span className="ml-1.5 text-[0.4em] tracking-normal text-dim">mi</span>
                      </>
                    }
                  />
                </div>
                <div className="border-b border-line p-5 sm:p-6 lg:border-r lg:border-b-0">
                  <RangeField
                    id="surge"
                    label="Demand"
                    hint={<span style={{ color: tone }}>{surgeLabel(surge)}</span>}
                    min={1}
                    max={3}
                    step={0.25}
                    value={surge}
                    onChange={setSurge}
                    tone={tone}
                    valueText={`×${surge.toFixed(2)}, ${surgeLabel(surge)}`}
                    scale={['×1.0 calm', '×3.0 peak']}
                    display={
                      <span className="transition-colors duration-300" style={{ color: tone }}>
                        <span className="mr-0.5 text-[0.55em]">×</span>
                        {surge.toFixed(2)}
                      </span>
                    }
                  />
                </div>
                {/* phones: the price comes first, right under the ride pills */}
                <div className="order-first md:order-none md:col-span-2 lg:col-span-1">
                  <EstimateCell price={quotes.prices[ride]} loading={quotes.loading} ride={ride} />
                </div>
              </form>
            </motion.div>
          </div>
        </section>
      </div>

      <CompareChart
        types={types}
        prices={quotes.prices}
        selected={ride}
        onSelect={setRide}
        distance={distance}
        surge={surge}
      />

      <ModelSection />

      <footer className="overflow-hidden px-4 pt-16 sm:px-8">
        <div className="flex flex-wrap items-baseline justify-between gap-4 text-[13px] text-dim">
          <p>A model estimate — not an official Uber or Lyft fare.</p>
          <p className="font-mono text-[12px] text-faint">API · {API_URL}</p>
        </div>
        <p
          aria-hidden
          className="mt-10 -mb-[0.2em] text-[clamp(4.5rem,21vw,22rem)] leading-[0.8] font-normal tracking-[-0.075em] whitespace-nowrap text-ink-3 select-none"
        >
          fare radar
        </p>
      </footer>

      <Toaster
        theme="dark"
        position="bottom-center"
        toastOptions={{ classNames: { toast: '!rounded-2xl !border-line !bg-ink-2 !font-sans' } }}
      />
    </>
  )
}
