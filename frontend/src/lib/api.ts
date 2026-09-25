// Same-origin by default: the Vite server proxies /api to FastAPI (see vite.config.ts).
const BASE_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '')

export const API_URL = BASE_URL

export class ApiError extends Error {
  readonly status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number
}

async function request<T>(path: string, { timeoutMs = 8000, signal, ...init }: RequestOptions = {}): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  const onOuterAbort = () => ctrl.abort()
  signal?.addEventListener('abort', onOuterAbort)

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', ...init.headers },
    })
  } catch (err) {
    if (signal?.aborted) throw err
    throw new ApiError(ctrl.signal.aborted ? 'The server took too long to respond' : 'Can’t connect to the API')
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onOuterAbort)
  }

  if (!res.ok) {
    let detail: string | undefined
    try {
      const body = await res.json()
      detail = Array.isArray(body.detail)
        ? body.detail.map((d: { msg: string }) => d.msg).join('; ')
        : body.detail
    } catch {
      /* body is not JSON — fall back to the status code */
    }
    throw new ApiError(detail ?? `Server error (${res.status})`, res.status)
  }
  return res.json() as Promise<T>
}

export interface PredictRequest {
  distance: number
  surge_multiplier: number
  name: string
}

export const getHealth = () => request<{ status: string }>('/health', { timeoutMs: 4000 })

export const getRideTypes = () => request<{ types: string[] }>('/ride-types')

export const predict = (body: PredictRequest, signal?: AbortSignal) =>
  request<{ price: number }>('/predict', { method: 'POST', body: JSON.stringify(body), signal })
