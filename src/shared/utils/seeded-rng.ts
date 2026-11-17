/**
 * Mulberry32 — fast, deterministic 32-bit PRNG.
 * Suitable for game simulation where reproducibility matters.
 */

export class SeededRNG {
  private state: number

  constructor(seed: number) {
    // Ensure integer seed
    this.state = seed | 0
  }

  /**
   * Returns a pseudo-random float in [0, 1).
   * Advances internal state by one step.
   */
  next(): number {
    let t = (this.state += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  /**
   * Returns a pseudo-random integer in [min, max] (inclusive).
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  /**
   * Returns a pseudo-random float in [min, max).
   */
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min
  }

  /**
   * Returns the current internal state (for serialization).
   */
  getState(): number {
    return this.state
  }

  /**
   * Restores internal state (for deserialization).
   */
  setState(state: number): void {
    this.state = state | 0
  }
}

