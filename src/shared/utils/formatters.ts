/**
 * Number and entity formatting utilities for Evolution Sandbox.
 */

/**
 * Formats a biological organism population count according to user specifications:
 * - >= 1,000,000,000 (1 billion): '∞' (infinity)
 * - >= 1,000,000: 'Xm' (e.g. 1.2m, 45m)
 * - >= 1,000: 'Xk' (e.g. 1.5k, 48k)
 * - < 1,000: raw integer string (e.g. 48, 950)
 */
export function formatPopulation(pop: number): string {
  if (typeof pop !== 'number' || isNaN(pop)) {
    return '0'
  }
  if (!Number.isFinite(pop) || pop >= 1_000_000_000) {
    return '∞'
  }
  if (pop <= 0) {
    return '0'
  }
  if (pop >= 1_000_000) {
    const m = pop / 1_000_000
    return `${m >= 10 ? Math.floor(m) : Number(m.toFixed(1))}m`
  }
  if (pop >= 1_000) {
    const k = pop / 1_000
    return `${k >= 10 ? Math.floor(k) : Number(k.toFixed(1))}k`
  }
  return Math.floor(pop).toLocaleString()
}

