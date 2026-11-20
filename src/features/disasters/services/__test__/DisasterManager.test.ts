import { describe, it, expect, beforeEach } from 'vitest'
import { DisasterManager } from '../DisasterManager.js'

describe('DisasterManager', () => {
  let manager: DisasterManager

  beforeEach(() => {
    manager = new DisasterManager()
  })

  it('triggers an asteroid impact with initial pulse mortality and dust', () => {
    const disaster = manager.triggerDisaster('asteroid_impact', 0.8, 0)
    expect(disaster.type).toBe('asteroid_impact')
    expect(disaster.remainingRotations).toBeGreaterThan(0)

    const perturbations = manager.getPerturbations()
    expect(perturbations.instantMortalityRate).toBeGreaterThan(0)
    expect(perturbations.atmosphericDust).toBeGreaterThan(0.5)
    expect(perturbations.temperatureDeltaCelsius).toBeLessThan(0) // Impact winter
  })

  it('clears pulse mortality on the next rotation', () => {
    manager.triggerDisaster('asteroid_impact', 0.8, 0)
    expect(manager.getPerturbations().instantMortalityRate).toBeGreaterThan(0)

    // Advance 1 rotation
    manager.step(1)
    expect(manager.getPerturbations().instantMortalityRate).toBe(0)
  })

  it('ice age induces deep temperature drop and duration countdown', () => {
    const disaster = manager.triggerDisaster('ice_age', 0.9, 0)
    const initialRotations = disaster.remainingRotations

    manager.step(1)
    const p = manager.getPerturbations()
    expect(p.temperatureDeltaCelsius).toBeLessThan(-10)

    // Summaries reflect remaining rotations
    const summaries = manager.getActiveSummaries()
    expect(summaries.length).toBe(1)
    expect(summaries[0]!.remainingRotations).toBe(initialRotations - 1)
  })

  it('solar flare boosts radiation and mutation multipliers', () => {
    manager.triggerDisaster('solar_flare', 0.8, 0)
    const p = manager.getPerturbations()
    expect(p.radiationMultiplier).toBeGreaterThan(3.0)
    expect(p.mutationRateMultiplier).toBeGreaterThan(4.0)
  })

  it('expires disasters after duration elapsed and returns to default', () => {
    const disaster = manager.triggerDisaster('solar_flare', 0.5, 0)
    const duration = disaster.durationRotations

    for (let r = 1; r <= duration + 1; r++) {
      manager.step(r)
    }

    expect(manager.getActiveSummaries().length).toBe(0)
    const p = manager.getPerturbations()
    expect(p.radiationMultiplier).toBe(1.0)
    expect(p.mutationRateMultiplier).toBe(1.0)
    expect(p.temperatureDeltaCelsius).toBe(0)
  })

  it('stacks multiple concurrent disasters correctly', () => {
    manager.triggerDisaster('ice_age', 0.7, 0)
    manager.triggerDisaster('solar_flare', 0.8, 0)

    const p = manager.getPerturbations()
    expect(p.temperatureDeltaCelsius).toBeLessThan(0) // From ice age
    expect(p.radiationMultiplier).toBeGreaterThan(3.0) // From solar flare
    expect(manager.getActiveSummaries().length).toBe(2)
  })

  it('resets state completely on reset()', () => {
    manager.triggerDisaster('volcanic_eruption', 1.0, 0)
    expect(manager.getActiveSummaries().length).toBe(1)

    manager.reset()
    expect(manager.getActiveSummaries().length).toBe(0)
    expect(manager.getPerturbations().temperatureDeltaCelsius).toBe(0)
  })

  it('spontaneously spawns natural disasters at arbitrary rotation intervals when enabled', () => {
    // Enable auto-disasters with high probability for testing
    manager.setAutoDisastersEnabled(true)
    manager.setDisasterIntervalConfig(10, 1.0) // 10 rotations peace, 100% chance

    // Before rotation 25, no spontaneous disasters spawn (safety buffer for primordial life)
    for (let r = 0; r < 24; r++) {
      manager.step(r)
    }
    expect(manager.getActiveSummaries().length).toBe(0)

    // At rotation 25+, spontaneous disaster strikes!
    manager.step(25)
    expect(manager.getActiveSummaries().length).toBe(1)
    const activeDisaster = manager.getActiveSummaries()[0]!
    expect(activeDisaster.remainingRotations).toBeGreaterThan(0)
    expect(activeDisaster.severity).toBeGreaterThanOrEqual(0.35)
  })

  it('respects auto-disasters disabled flag', () => {
    manager.setAutoDisastersEnabled(false)
    manager.setDisasterIntervalConfig(5, 1.0)

    for (let r = 0; r <= 50; r++) {
      manager.step(r)
    }
    expect(manager.getActiveSummaries().length).toBe(0)
  })

  it('preserves auto-disaster state across export and restore', () => {
    manager.setAutoDisastersEnabled(false)
    const exported = manager.exportState()
    expect(exported.autoDisastersEnabled).toBe(false)

    const newManager = new DisasterManager()
    expect(newManager.isAutoDisastersEnabled()).toBe(true)
    newManager.restoreState(exported, 10)
    expect(newManager.isAutoDisastersEnabled()).toBe(false)
  })
})

