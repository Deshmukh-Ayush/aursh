export type CurrencyCode = "INR" | "USD"

/** Default static fallback exchange rate in case live APIs are unreachable on cold start */
export const DEFAULT_USD_TO_INR_FALLBACK = 95.43

/** Backward-compatible constant alias */
export const USD_TO_INR_RATE = DEFAULT_USD_TO_INR_FALLBACK

/** 24-hour cache TTL in milliseconds */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

interface FxRateCache {
  rate: number
  lastFetchedAt: number
  source: string
}

// In-memory cache holding the most recent successfully fetched or default rate
const fxCache: FxRateCache = {
  rate: DEFAULT_USD_TO_INR_FALLBACK,
  lastFetchedAt: 0,
  source: "default_fallback",
}

// In-flight promise to dedup simultaneous concurrent requests
let pendingFetchPromise: Promise<number> | null = null

/**
 * Fetches the live USD to INR exchange rate with a 24-hour cache.
 * Uses open.er-api.com as primary source with api.frankfurter.dev as secondary fallback.
 * Gracefully returns the last known rate or static fallback if all APIs are unreachable.
 */
export async function getUsdToInrRate(): Promise<number> {
  const now = Date.now()

  // Return cached rate if still within 24h TTL
  if (fxCache.lastFetchedAt > 0 && now - fxCache.lastFetchedAt < CACHE_TTL_MS) {
    return fxCache.rate
  }

  // Deduplicate concurrent requests
  if (pendingFetchPromise) {
    return pendingFetchPromise
  }

  pendingFetchPromise = (async () => {
    try {
      // 1. Try Primary: open.er-api.com (Keyless, high-reliability open FX feed)
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 6000)

        const res = await fetch("https://open.er-api.com/v6/latest/USD", {
          signal: controller.signal,
          next: { revalidate: 86400 },
        } as RequestInit)

        clearTimeout(timeoutId)

        if (res.ok) {
          const data = (await res.json()) as { result?: string; rates?: Record<string, number> }
          if (data.result === "success" && typeof data.rates?.INR === "number" && data.rates.INR > 0) {
            fxCache.rate = data.rates.INR
            fxCache.lastFetchedAt = Date.now()
            fxCache.source = "open.er-api.com"
            return fxCache.rate
          }
        }
      } catch (primaryErr) {
        console.warn("[Currency] Primary FX API (open.er-api.com) failed, trying secondary fallback:", primaryErr)
      }

      // 2. Try Secondary Fallback: api.frankfurter.dev (European Central Bank reference rates)
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 6000)

        const res = await fetch("https://api.frankfurter.dev/v1/latest?base=USD&symbols=INR", {
          signal: controller.signal,
          next: { revalidate: 86400 },
        } as RequestInit)

        clearTimeout(timeoutId)

        if (res.ok) {
          const data = (await res.json()) as { rates?: Record<string, number> }
          if (typeof data.rates?.INR === "number" && data.rates.INR > 0) {
            fxCache.rate = data.rates.INR
            fxCache.lastFetchedAt = Date.now()
            fxCache.source = "api.frankfurter.dev"
            return fxCache.rate
          }
        }
      } catch (secondaryErr) {
        console.warn("[Currency] Secondary FX API (frankfurter.dev) failed:", secondaryErr)
      }

      // 3. Fall back to last cached rate or static fallback
      console.warn(
        `[Currency] Unable to fetch live FX rate from APIs. Falling back to rate ${fxCache.rate} (source: ${fxCache.source}, last updated: ${
          fxCache.lastFetchedAt ? new Date(fxCache.lastFetchedAt).toISOString() : "never"
        })`
      )
      return fxCache.rate
    } finally {
      pendingFetchPromise = null
    }
  })()

  return pendingFetchPromise
}

/**
 * Returns the current cached exchange rate synchronously without making network requests.
 */
export function getUsdToInrRateSync(): number {
  return fxCache.rate
}

export function formatCurrency(
  amount: number,
  currency: string = "INR",
  targetCurrency?: string,
  exchangeRate?: number
): string {
  const normCurrency = (currency || "INR").toUpperCase()
  const normTarget = targetCurrency ? targetCurrency.toUpperCase() : normCurrency
  const rate = exchangeRate ?? getUsdToInrRateSync()

  // Convert USD -> INR
  if ((normCurrency === "USD" || normCurrency === "$") && normTarget === "INR") {
    const converted = amount * rate
    return `₹${Math.round(converted).toLocaleString("en-IN")}`
  }

  // Convert INR -> USD
  if ((normCurrency === "INR" || normCurrency === "₹") && normTarget === "USD") {
    const converted = amount / rate
    return `$${Math.round(converted).toLocaleString("en-US")}`
  }

  // Native formatting
  if (normCurrency === "USD" || normCurrency === "$") {
    return `$${Math.round(amount).toLocaleString("en-US")}`
  }

  return `₹${Math.round(amount).toLocaleString("en-IN")}`
}

export function convertToINR(
  amount: number,
  currency: string = "INR",
  exchangeRate?: number
): number {
  const norm = (currency || "INR").toUpperCase()
  const rate = exchangeRate ?? getUsdToInrRateSync()
  if (norm === "USD" || norm === "$") {
    return Math.round(amount * rate)
  }
  return amount
}

export interface ConvertibleFinancialItem {
  amount: number;
  currency: string;
  fxRateAtPayment?: number | string | null;
  isPaid?: boolean;
}

/**
 * Converts an individual monetary amount between USD and INR.
 * Uses fxRateAtPayment if provided (historical lock), otherwise falls back to liveRate.
 */
export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  options?: {
    fxRateAtPayment?: number | string | null;
    liveRate?: number;
  }
): number {
  const normFrom = (fromCurrency || "USD").toUpperCase()
  const normTo = (toCurrency || "USD").toUpperCase()

  if (normFrom === normTo) {
    return amount
  }

  const rate = options?.fxRateAtPayment
    ? Number(options.fxRateAtPayment)
    : (options?.liveRate ?? getUsdToInrRateSync())

  if (rate <= 0) return amount

  // USD -> INR
  if ((normFrom === "USD" || normFrom === "$") && normTo === "INR") {
    return Math.round(amount * rate)
  }

  // INR -> USD
  if ((normFrom === "INR" || normFrom === "₹") && normTo === "USD") {
    return Math.round(amount / rate)
  }

  return amount
}

/**
 * Converts each item in a list to targetCurrency individually (convert-then-sum),
 * preserving locked historical FX rates for completed money while using live rate
 * for upcoming/pending figures.
 */
export function convertAndAggregate(
  items: ConvertibleFinancialItem[],
  targetCurrency: "USD" | "INR" | string = "USD",
  liveRate?: number
): {
  total: number;
  items: Array<ConvertibleFinancialItem & { convertedAmount: number }>;
} {
  const normTarget = (targetCurrency || "USD").toUpperCase()
  const currentLiveRate = liveRate ?? getUsdToInrRateSync()

  const convertedItems = items.map((item) => {
    const convertedAmount = convertAmount(item.amount, item.currency, normTarget, {
      fxRateAtPayment: item.fxRateAtPayment,
      liveRate: currentLiveRate,
    })
    return {
      ...item,
      convertedAmount,
    }
  })

  const total = convertedItems.reduce((sum, item) => sum + item.convertedAmount, 0)

  return {
    total,
    items: convertedItems,
  }
}

