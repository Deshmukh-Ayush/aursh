export type CurrencyCode = "INR" | "USD"

// Exchange rate: 1 USD = 95.43 INR
export const USD_TO_INR_RATE = 95.43

export function formatCurrency(
  amount: number,
  currency: string = "INR",
  targetCurrency?: string
): string {
  const normCurrency = (currency || "INR").toUpperCase()
  const normTarget = targetCurrency ? targetCurrency.toUpperCase() : normCurrency

  // Convert USD -> INR
  if ((normCurrency === "USD" || normCurrency === "$") && normTarget === "INR") {
    const converted = amount * USD_TO_INR_RATE
    return `₹${Math.round(converted).toLocaleString("en-IN")}`
  }

  // Convert INR -> USD
  if ((normCurrency === "INR" || normCurrency === "₹") && normTarget === "USD") {
    const converted = amount / USD_TO_INR_RATE
    return `$${Math.round(converted).toLocaleString("en-US")}`
  }

  // Native formatting
  if (normCurrency === "USD" || normCurrency === "$") {
    return `$${Math.round(amount).toLocaleString("en-US")}`
  }

  return `₹${Math.round(amount).toLocaleString("en-IN")}`
}

export function convertToINR(amount: number, currency: string = "INR"): number {
  const norm = (currency || "INR").toUpperCase()
  if (norm === "USD" || norm === "$") {
    return Math.round(amount * USD_TO_INR_RATE)
  }
  return amount
}
