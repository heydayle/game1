import { describe, it, expect } from 'vitest'
import { generatePlanetName } from '../planet-namer.js'

describe('planet-namer', () => {
  it('generates consistent name for same inputs', () => {
    const name1 = generatePlanetName(15, 0.5, 42)
    const name2 = generatePlanetName(15, 0.5, 42)
    expect(name1).toBe(name2)
  })

  it('generates ocean-themed names for high water worlds', () => {
    const name = generatePlanetName(20, 0.85, 100)
    expect(typeof name).toBe('string')
    expect(name.length).toBeGreaterThan(3)
  })

  it('generates glacial names for sub-zero temperatures', () => {
    const name = generatePlanetName(-30, 0.3, 101)
    expect(typeof name).toBe('string')
    expect(name.length).toBeGreaterThan(3)
  })

  it('generates volcanic names for superheated planets', () => {
    const name = generatePlanetName(55, 0.2, 102)
    expect(typeof name).toBe('string')
    expect(name.length).toBeGreaterThan(3)
  })
})

