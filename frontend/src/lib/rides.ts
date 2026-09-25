export type Brand = 'uber' | 'lyft'

export interface RideMeta {
  brand: Brand
  tier: string
  seats: string
}

// Key order is the display order: Uber first, then Lyft, cheapest tier → premium.
const RIDES: Record<string, RideMeta> = {
  UberPool: { brand: 'uber', tier: 'Shared', seats: '1–2' },
  UberX: { brand: 'uber', tier: 'Economy', seats: '4' },
  WAV: { brand: 'uber', tier: 'Wheelchair', seats: '4' },
  'Black SUV': { brand: 'uber', tier: 'Premium', seats: '6' },
  Shared: { brand: 'lyft', tier: 'Shared', seats: '1–2' },
  Lyft: { brand: 'lyft', tier: 'Economy', seats: '4' },
  'Lux Black': { brand: 'lyft', tier: 'Premium', seats: '4' },
  'Lux Black XL': { brand: 'lyft', tier: 'Premium XL', seats: '6' },
}

const ORDER = Object.keys(RIDES)

export const FALLBACK_TYPES = ORDER

export function rideMeta(name: string): RideMeta {
  return RIDES[name] ?? { brand: /uber/i.test(name) ? 'uber' : 'lyft', tier: 'Ride', seats: '—' }
}

export function sortRides(types: string[]): string[] {
  const rank = (n: string) => (ORDER.includes(n) ? ORDER.indexOf(n) : ORDER.length)
  return [...types].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
}

export const BRAND_LOGO: Record<Brand, string> = {
  uber: 'https://api.iconify.design/simple-icons/uber.svg?color=%23f5f5f5',
  lyft: 'https://api.iconify.design/simple-icons/lyft.svg?color=%23ff2fb9',
}

/** Logos for use on the light (paper) surface. */
export const BRAND_LOGO_ON_LIGHT: Record<Brand, string> = {
  uber: 'https://api.iconify.design/simple-icons/uber.svg?color=%23111111',
  lyft: 'https://api.iconify.design/simple-icons/lyft.svg?color=%23e0009f',
}

/** Demand colour: calm green at ×1.0 → hot red at ×3.0. */
export const heatTone = (surge: number) =>
  `color-mix(in oklch, var(--color-surge) ${((surge - 1) / 2) * 100}%, var(--color-calm))`

export const MILES_TO_KM = 1.60934
export const MAX_DISTANCE = 8

export const formatPrice = (v: number) => `$${v.toFixed(2)}`

export function surgeLabel(s: number): string {
  if (s <= 1) return 'Normal demand'
  if (s <= 1.5) return 'Elevated demand'
  if (s <= 2.25) return 'High demand'
  return 'Peak demand'
}
