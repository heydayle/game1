import { describe, it, expect } from 'vitest'
import { formatPopulation } from '../formatters.js'

describe('formatPopulation', () => {
  it('formats populations under 1000 as raw number string', () => {
    expect(formatPopulation(0)).toBe('0')
    expect(formatPopulation(48)).toBe('48')
    expect(formatPopulation(999)).toBe('999')
  })

  it('formats populations from 1000 to under 1000000 with k unit', () => {
    expect(formatPopulation(1000)).toBe('1k')
    expect(formatPopulation(1500)).toBe('1.5k')
    expect(formatPopulation(48000)).toBe('48k')
    expect(formatPopulation(950500)).toBe('950k')
  })

  it('formats populations from 1000000 to under 1 billion with m unit', () => {
    expect(formatPopulation(1000000)).toBe('1m')
    expect(formatPopulation(1200000)).toBe('1.2m')
    expect(formatPopulation(45000000)).toBe('45m')
    expect(formatPopulation(999000000)).toBe('999m')
  })

  it('formats populations of 1 billion or greater as infinity symbol ∞', () => {
    expect(formatPopulation(1000000000)).toBe('∞')
    expect(formatPopulation(2500000000)).toBe('∞')
    expect(formatPopulation(Number.POSITIVE_INFINITY)).toBe('∞')
  })

  it('handles negative or invalid population safely', () => {
    expect(formatPopulation(-10)).toBe('0')
    expect(formatPopulation(NaN)).toBe('0')
  })
})

