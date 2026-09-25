import { BRAND_LOGO, BRAND_LOGO_ON_LIGHT, rideMeta } from '../lib/rides'

interface Props {
  types: string[]
  selected: string
  onSelect: (name: string) => void
  prices: Record<string, number>
  loading: boolean
}

export function RideTypePicker({ types, selected, onSelect, prices, loading }: Props) {
  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">Ride type</legend>
      <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
        {types.map((name) => {
          const meta = rideMeta(name)
          const active = name === selected
          const price = prices[name]
          return (
            <label
              key={name}
              title={`${meta.tier}, seats: ${meta.seats}`}
              className={`flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full border pr-3 pl-3.5 text-[13px] transition-colors duration-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-paper ${
                active
                  ? 'border-paper bg-paper text-ink'
                  : 'border-line bg-ink/55 text-paper backdrop-blur-md hover:border-white/25'
              }`}
            >
              <input
                type="radio"
                name="ride"
                value={name}
                checked={active}
                onChange={() => onSelect(name)}
                className="sr-only"
              />
              <img
                src={(active ? BRAND_LOGO_ON_LIGHT : BRAND_LOGO)[meta.brand]}
                alt={meta.brand === 'uber' ? 'Uber' : 'Lyft'}
                className="h-2.5 w-auto"
              />
              <span className="font-medium">{name}</span>
              {price !== undefined ? (
                <span
                  className={`font-mono text-[12px] tabular-nums transition-opacity ${active ? 'text-ink/60' : 'text-faint'}`}
                  style={{ opacity: loading ? 0.5 : 1 }}
                >
                  ${price.toFixed(2)}
                </span>
              ) : (
                <span className="shimmer h-3 w-9 rounded" aria-hidden />
              )}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
