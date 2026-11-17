import { describe, it, expect } from 'vitest'
import { SeededRNG } from '../seeded-rng.js'

describe('SeededRNG', () => {
  it('produces deterministic sequence from same seed', () => {
    const rng1 = new SeededRNG(42)
    const rng2 = new SeededRNG(42)

    const seq1 = Array.from({ length: 100 }, () => rng1.next())
    const seq2 = Array.from({ length: 100 }, () => rng2.next())

    expect(seq1).toEqual(seq2)
  })

  it('produces different sequences from different seeds', () => {
    const rng1 = new SeededRNG(42)
    const rng2 = new SeededRNG(43)

    const seq1 = Array.from({ length: 10 }, () => rng1.next())
    const seq2 = Array.from({ length: 10 }, () => rng2.next())

    expect(seq1).not.toEqual(seq2)
  })

  it('produces values in [0, 1)', () => {
    const rng = new SeededRNG(12345)
    for (let i = 0; i < 1000; i++) {
      const val = rng.next()
      expect(val).toBeGreaterThanOrEqual(0)
      expect(val).toBeLessThan(1)
    }
  })

  it('nextInt produces integers in [min, max]', () => {
    const rng = new SeededRNG(999)
    for (let i = 0; i < 100; i++) {
      const val = rng.nextInt(5, 15)
      expect(Number.isInteger(val)).toBe(true)
      expect(val).toBeGreaterThanOrEqual(5)
      expect(val).toBeLessThanOrEqual(15)
    }
  })

  it('nextFloat produces floats in [min, max)', () => {
    const rng = new SeededRNG(777)
    for (let i = 0; i < 100; i++) {
      const val = rng.nextFloat(2.0, 8.0)
      expect(val).toBeGreaterThanOrEqual(2.0)
      expect(val).toBeLessThan(8.0)
    }
  })

  it('can save and restore state', () => {
    const rng = new SeededRNG(42)
    // Advance a few steps
    rng.next()
    rng.next()
    rng.next()

    const savedState = rng.getState()
    const nextValues = Array.from({ length: 10 }, () => rng.next())

    // Restore and verify same sequence
    rng.setState(savedState)
    const restoredValues = Array.from({ length: 10 }, () => rng.next())

    expect(restoredValues).toEqual(nextValues)
  })

  it('has reasonable distribution', () => {
    const rng = new SeededRNG(54321)
    const buckets = new Array(10).fill(0) as number[]
    const n = 10000

    for (let i = 0; i < n; i++) {
      const bucket = Math.floor(rng.next() * 10)
      buckets[bucket]!++
    }

    // Each bucket should have roughly n/10 = 1000 values
    // Allow 30% deviation
    for (const count of buckets) {
      expect(count).toBeGreaterThan(700)
      expect(count).toBeLessThan(1300)
    }
  })
})

