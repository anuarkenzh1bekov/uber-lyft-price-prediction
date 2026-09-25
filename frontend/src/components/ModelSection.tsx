import { FACTS } from '../lib/facts'
import { SectionTag } from './CompareChart'

const STATS = [
  [FACTS.r2.toFixed(2), 'R² on held-out rides'],
  [`$${FACTS.rmse.toFixed(2)}`, 'Typical error (RMSE)'],
  ['3', 'Inputs: distance, demand, ride type'],
  [`${FACTS.maxDistance} mi`, 'Longest trip in the data'],
]

export function ModelSection() {
  const names = [...FACTS.neighborhoods, ...FACTS.neighborhoods]
  return (
    <section
      id="model"
      aria-labelledby="model-title"
      className="mx-2 scroll-mt-3 overflow-hidden rounded-[28px] bg-ink-2 py-20 sm:mx-3 lg:py-28"
    >
      <div className="px-4 sm:px-8 lg:px-14">
        <SectionTag index="03">The model</SectionTag>
        <h2
          id="model-title"
          className="mt-10 max-w-[22ch] text-[clamp(2rem,4.4vw,4rem)] leading-[1.02] font-normal tracking-[-0.05em] text-paper/35"
        >
          Built on <span className="text-paper">{FACTS.pricedRides.toLocaleString('en-US')} priced rides</span> across{' '}
          <span className="text-paper">{FACTS.neighborhoods.length} Boston neighborhoods</span>, reduced to three things
          you can set.
        </h2>

        <dl className="mt-16 grid grid-cols-2 gap-x-6 gap-y-10 border-t border-line pt-8 lg:grid-cols-4">
          {STATS.map(([value, label]) => (
            <div key={label}>
              <dd className="text-[clamp(2.4rem,4vw,3.75rem)] leading-none font-light tracking-[-0.055em] tabular-nums">
                {value}
              </dd>
              <dt className="mt-3 max-w-[18ch] text-[13px] text-dim">{label}</dt>
            </div>
          ))}
        </dl>
      </div>

      <div className="marquee mt-20 overflow-hidden" aria-label="Neighborhoods in the dataset">
        <ul className="marquee-track flex w-max gap-2">
          {names.map((n, i) => (
            <li
              key={i}
              aria-hidden={i >= FACTS.neighborhoods.length}
              className="rounded-full border border-line px-5 py-2.5 text-[14px] whitespace-nowrap text-dim"
            >
              {n}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
