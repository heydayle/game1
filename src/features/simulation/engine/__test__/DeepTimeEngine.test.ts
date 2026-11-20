import { describe, it, expect } from 'vitest'
import { DeepTimeEngine } from '../DeepTimeEngine.js'

describe('DeepTimeEngine - Deep Geological Time Model', () => {
  it('correctly calculates day-to-year astronomical conversions', () => {
    const rotations = 365.25 * 100 // 100 years
    const snapshot = DeepTimeEngine.calculate(rotations)

    expect(snapshot.totalRotations).toBe(rotations)
    expect(Math.round(snapshot.elapsedYears)).toBe(100)
    expect(snapshot.currentEon).toBe('hadean')
    expect(snapshot.elapsedMegaYears).toBeLessThan(1.0)
  })

  it('supports custom geological time scaling (e.g. fast-forward epochs)', () => {
    // 1 rotation = 1,000,000 years (1 Ma)
    const snapshotHadean = DeepTimeEngine.calculate(500, { yearsPerRotation: 1_000_000 })
    expect(snapshotHadean.elapsedMegaYears).toBe(500)
    expect(snapshotHadean.currentEon).toBe('hadean')
    expect(snapshotHadean.eonLabel).toContain('Hadean')
    expect(snapshotHadean.biogenesisWindowOpen).toBe(true)

    // Archean boundary: 1000 Ma elapsed
    const snapshotArchean = DeepTimeEngine.calculate(1000, { yearsPerRotation: 1_000_000 })
    expect(snapshotArchean.elapsedMegaYears).toBe(1000)
    expect(snapshotArchean.currentEon).toBe('archean')
    expect(snapshotArchean.eonLabel).toContain('Archean')
    expect(snapshotArchean.greatOxidationEventThresholdReached).toBe(false)

    // Proterozoic: 2500 Ma elapsed (post-GOE)
    const snapshotProterozoic = DeepTimeEngine.calculate(2500, { yearsPerRotation: 1_000_000 })
    expect(snapshotProterozoic.elapsedMegaYears).toBe(2500)
    expect(snapshotProterozoic.currentEon).toBe('proterozoic')
    expect(snapshotProterozoic.eonLabel).toContain('Proterozoic')
    expect(snapshotProterozoic.greatOxidationEventThresholdReached).toBe(true)

    // Phanerozoic: 4200 Ma elapsed (Cambrian explosion & higher life)
    const snapshotPhanerozoic = DeepTimeEngine.calculate(4200, { yearsPerRotation: 1_000_000 })
    expect(snapshotPhanerozoic.elapsedMegaYears).toBe(4200)
    expect(snapshotPhanerozoic.currentEon).toBe('phanerozoic')
    expect(snapshotPhanerozoic.eonLabel).toContain('Phanerozoic')
    expect(snapshotPhanerozoic.cambrianExplosionReached).toBe(true)
  })

  it('formats geological ages cleanly into readable strings', () => {
    const snapGa = DeepTimeEngine.calculate(2000, { yearsPerRotation: 1_000_000 })
    expect(DeepTimeEngine.formatGeologicalAge(snapGa)).toBe('2.00 Ga (Tỷ năm)')

    const snapMa = DeepTimeEngine.calculate(150, { yearsPerRotation: 1_000_000 })
    expect(DeepTimeEngine.formatGeologicalAge(snapMa)).toBe('150.0 Ma (Triệu năm)')

    const snapYr = DeepTimeEngine.calculate(36525)
    expect(DeepTimeEngine.formatGeologicalAge(snapYr)).toContain('100 năm')

    const snapDays = DeepTimeEngine.calculate(45)
    expect(DeepTimeEngine.formatGeologicalAge(snapDays)).toBe('45 vòng quay (Ngày)')
  })
})
