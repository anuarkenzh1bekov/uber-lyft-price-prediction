import { useEffect, useState } from 'react'
import { getHealth, getRideTypes, predict } from '../lib/api'
import { FALLBACK_TYPES, sortRides } from '../lib/rides'

export type ApiStatus = 'checking' | 'online' | 'offline'

export function useHealth(intervalMs = 8000): ApiStatus {
  const [status, setStatus] = useState<ApiStatus>('checking')
  useEffect(() => {
    let alive = true
    const tick = async () => {
      try {
        await getHealth()
        if (alive) setStatus('online')
      } catch {
        if (alive) setStatus('offline')
      }
    }
    tick()
    const id = setInterval(tick, intervalMs)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [intervalMs])
  return status
}

export function useRideTypes(status: ApiStatus): string[] {
  const [types, setTypes] = useState<string[]>(FALLBACK_TYPES)
  useEffect(() => {
    if (status !== 'online') return
    let alive = true
    getRideTypes()
      .then(({ types }) => alive && types.length > 0 && setTypes(sortRides(types)))
      .catch(() => {
        /* keep the fallback list; the health pill already signals trouble */
      })
    return () => {
      alive = false
    }
  }, [status])
  return types
}

export interface Quotes {
  prices: Record<string, number>
  loading: boolean
  error: string | null
}

/** Prices every ride type for the current trip, debounced; stale requests are aborted. */
export function useQuotes(types: string[], distance: number, surge: number, enabled: boolean): Quotes {
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const key = types.join('|')

  useEffect(() => {
    if (!enabled || types.length === 0) return
    const ctrl = new AbortController()
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const entries = await Promise.all(
          types.map(async (name) => {
            const { price } = await predict({ distance, surge_multiplier: surge, name }, ctrl.signal)
            return [name, price] as const
          }),
        )
        setPrices(Object.fromEntries(entries))
        setError(null)
      } catch (err) {
        if (ctrl.signal.aborted) return
        setError(err instanceof Error ? err.message : 'Couldn’t get a price')
      } finally {
        if (!ctrl.signal.aborted) setLoading(false)
      }
    }, 220)
    return () => {
      clearTimeout(timer)
      ctrl.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, distance, surge, enabled])

  return { prices, loading, error }
}
