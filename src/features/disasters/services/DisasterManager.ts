import {
  type ActiveDisaster,
  type ActiveDisasterSummary,
  type DisasterType,
  type EnvironmentalPerturbations,
} from '../types.js'
import { DEFAULT_PERTURBATIONS, DISASTER_CATALOG } from '../constants.js'
import type { PlanetConfig } from '../../genesis/types/genesis.js'

export class DisasterManager {
  private activeDisasters: ActiveDisaster[] = []
  private nextDisasterId = 1
  private currentPerturbations: EnvironmentalPerturbations = { ...DEFAULT_PERTURBATIONS }
  private lastPulseRotation = -1
  private autoDisastersEnabled = true
  private minPeaceRotations = 30
  private baseDisasterChance = 0.02
  private lastDisasterEndRotation = 0

  /**
   * Sets whether random spontaneous natural disasters are enabled.
   */
  setAutoDisastersEnabled(enabled: boolean): void {
    this.autoDisastersEnabled = enabled
  }

  /**
   * Checks if random spontaneous natural disasters are enabled.
   */
  isAutoDisastersEnabled(): boolean {
    return this.autoDisastersEnabled
  }

  /**
   * Configures stochastic natural disaster cadence intervals.
   */
  setDisasterIntervalConfig(minPeaceRotations: number, baseChance: number): void {
    this.minPeaceRotations = Math.max(1, minPeaceRotations)
    this.baseDisasterChance = Math.max(0.001, Math.min(1.0, baseChance))
  }

  /**
   * Selects a disaster type weighted by planetary environmental conditions or uniformly.
   */
  private selectDisasterType(
    rng?: { next(): number } | null,
    planetConfig?: PlanetConfig | null
  ): DisasterType {
    const types: DisasterType[] = [
      'asteroid_impact',
      'ice_age',
      'volcanic_eruption',
      'climate_shift',
      'solar_flare',
    ]

    const weights: Record<DisasterType, number> = {
      asteroid_impact: 1.0,
      ice_age: 1.0,
      volcanic_eruption: 1.0,
      climate_shift: 1.0,
      solar_flare: 1.0,
    }

    if (planetConfig) {
      if (planetConfig.surfaceTemperatureCelsius < 0) {
        weights.ice_age += 2.5
      } else if (planetConfig.surfaceTemperatureCelsius > 35) {
        weights.climate_shift += 2.0
        weights.volcanic_eruption += 1.5
      }

      if (
        planetConfig.environmentalConditions?.radiationLevel === 'intense' ||
        planetConfig.environmentalConditions?.radiationLevel === 'extreme'
      ) {
        weights.solar_flare += 2.5
      }

      if (
        planetConfig.environmentalConditions?.tectonicStability === 'active' ||
        planetConfig.environmentalConditions?.tectonicStability === 'cataclysmic'
      ) {
        weights.volcanic_eruption += 2.5
      }

      if (
        planetConfig.atmosphericComposition &&
        planetConfig.atmosphericComposition.pressureAtm < 0.7
      ) {
        weights.asteroid_impact += 2.0
      }
    }

    let totalWeight = 0
    for (const t of types) {
      totalWeight += weights[t]
    }

    const roll = (rng ? rng.next() : Math.random()) * totalWeight
    let cumulative = 0
    for (const t of types) {
      cumulative += weights[t]
      if (roll <= cumulative) {
        return t
      }
    }

    return types[Math.floor((rng ? rng.next() : Math.random()) * types.length)]!
  }

  /**
   * Triggers a new planetary disaster event.
   */
  triggerDisaster(
    type: DisasterType,
    severity = 0.8,
    currentRotation = 0,
    epicenterCellId?: number
  ): ActiveDisaster {
    const catalogEntry = DISASTER_CATALOG[type]
    const clampedSeverity = Math.max(0.1, Math.min(1.0, severity))
    const duration = Math.round(catalogEntry.defaultDurationRotations * (0.8 + 0.4 * clampedSeverity))

    const disaster: ActiveDisaster = {
      id: `dis_${this.nextDisasterId++}`,
      type,
      name: catalogEntry.name,
      severity: clampedSeverity,
      startRotation: currentRotation,
      durationRotations: duration,
      remainingRotations: duration,
      epicenterCellId,
      description: catalogEntry.description,
    }

    this.activeDisasters.push(disaster)
    this.lastPulseRotation = currentRotation
    this.lastDisasterEndRotation = currentRotation + duration
    this.recalculatePerturbations(currentRotation)
    return disaster
  }

  /**
   * Advances active disasters by one rotation.
   * Decrements remaining duration, removes expired disasters, and updates environmental perturbations.
   * Stochastically triggers spontaneous natural disasters if auto-disasters are enabled.
   */
  step(
    currentRotation: number,
    rng?: { next(): number } | null,
    planetConfig?: PlanetConfig | null
  ): EnvironmentalPerturbations {
    for (const disaster of this.activeDisasters) {
      disaster.remainingRotations = Math.max(0, disaster.remainingRotations - 1)
    }

    // Filter out expired events
    this.activeDisasters = this.activeDisasters.filter((d) => d.remainingRotations > 0)

    if (this.activeDisasters.length > 0) {
      this.lastDisasterEndRotation = currentRotation
    } else if (this.autoDisastersEnabled) {
      // Natural spontaneous disaster generation:
      // Allow life to take root first (currentRotation >= 25)
      // Then check if peaceful interval between disasters has elapsed
      const peacePeriod = currentRotation - this.lastDisasterEndRotation
      if (currentRotation >= 25 && peacePeriod >= this.minPeaceRotations) {
        const extraHazard = Math.min(0.06, (peacePeriod - this.minPeaceRotations) * 0.001)
        const disasterChance = this.baseDisasterChance + extraHazard
        const roll = rng ? rng.next() : Math.random()

        if (roll < disasterChance) {
          const chosenType = this.selectDisasterType(rng, planetConfig)
          const sevRoll = rng ? rng.next() : Math.random()
          const severity = Number((0.35 + sevRoll * 0.5).toFixed(2))
          const epicenterCellId = Math.floor((rng ? rng.next() : Math.random()) * 100)

          this.triggerDisaster(chosenType, severity, currentRotation, epicenterCellId)
        }
      }
    }

    this.recalculatePerturbations(currentRotation)
    return this.currentPerturbations
  }

  /**
   * Recalculates composite environmental perturbations across all concurrent disasters.
   */
  private recalculatePerturbations(currentRotation: number): void {
    if (this.activeDisasters.length === 0) {
      this.currentPerturbations = { ...DEFAULT_PERTURBATIONS }
      return
    }

    let tempDelta = 0
    let radiationMult = 1.0
    let dust = 0.0
    let mutationMult = 1.0
    let instantMortality = 0.0
    let oceanDelta = 0.0

    for (const disaster of this.activeDisasters) {
      const progress = disaster.remainingRotations / disaster.durationRotations // [1 -> 0]
      const sev = disaster.severity
      const isPulse = currentRotation === disaster.startRotation

      switch (disaster.type) {
        case 'asteroid_impact': {
          // Kinetic shockwave on first rotation of this specific disaster
          if (isPulse) {
            instantMortality = Math.max(instantMortality, 0.45 * sev)
          }
          // Impact winter cooling & atmospheric soot
          tempDelta -= 18 * sev * Math.pow(progress, 1.2)
          dust = Math.max(dust, 0.85 * sev * progress)
          oceanDelta -= 0.08 * sev * progress
          break
        }

        case 'ice_age': {
          // Prolonged deep freeze with peak in middle
          const curve = Math.sin(Math.PI * (1 - progress))
          tempDelta -= (12 + 16 * curve) * sev
          oceanDelta -= 0.15 * sev * curve
          dust = Math.max(dust, 0.15 * sev)
          break
        }

        case 'volcanic_eruption': {
          if (progress > 0.7) {
            // Early phase: ash cooling & particulate choking
            tempDelta -= 6 * sev * progress
            dust = Math.max(dust, 0.75 * sev * progress)
          } else {
            // Later phase: massive CO2 greenhouse surge
            tempDelta += 16 * sev * (1 - progress)
            dust = Math.max(dust, 0.25 * sev * progress)
          }
          if (isPulse) {
            instantMortality = Math.max(instantMortality, 0.2 * sev)
          }
          break
        }

        case 'climate_shift': {
          // Precessional oscillations
          const phase = (disaster.durationRotations - disaster.remainingRotations) * 0.75
          tempDelta += Math.sin(phase) * 14 * sev
          oceanDelta += Math.cos(phase) * 0.12 * sev
          break
        }

        case 'solar_flare': {
          // Extreme radiation and mutagenic flux
          radiationMult += 7.0 * sev * progress
          mutationMult += 8.0 * sev * progress
          if (isPulse) {
            instantMortality = Math.max(instantMortality, 0.3 * sev)
          }
          break
        }
      }
    }

    this.currentPerturbations = {
      temperatureDeltaCelsius: Math.round(tempDelta),
      radiationMultiplier: Math.max(0.1, Number(radiationMult.toFixed(2))),
      atmosphericDust: Math.min(1.0, Math.max(0.0, Number(dust.toFixed(3)))),
      mutationRateMultiplier: Math.max(1.0, Number(mutationMult.toFixed(2))),
      instantMortalityRate: Number(instantMortality.toFixed(2)),
      oceanLevelDelta: Number(oceanDelta.toFixed(3)),
    }
  }

  /**
   * Returns current composite environmental perturbations.
   */
  getPerturbations(): EnvironmentalPerturbations {
    return this.currentPerturbations
  }

  /**
   * Returns summary objects for active disasters ready for snapshot serialization.
   */
  getActiveSummaries(): ActiveDisasterSummary[] {
    return this.activeDisasters.map((d) => ({
      id: d.id,
      type: d.type,
      name: d.name,
      severity: d.severity,
      progress: Number((d.remainingRotations / d.durationRotations).toFixed(2)),
      remainingRotations: d.remainingRotations,
      durationRotations: d.durationRotations,
      epicenterCellId: d.epicenterCellId,
      description: d.description,
    }))
  }

  /**
   * Clears all active disasters and resets perturbations.
   */
  reset(): void {
    this.activeDisasters = []
    this.currentPerturbations = { ...DEFAULT_PERTURBATIONS }
    this.lastPulseRotation = -1
    this.lastDisasterEndRotation = 0
  }

  exportState(): {
    activeDisasters: ActiveDisaster[]
    nextDisasterId: number
    lastPulseRotation: number
    autoDisastersEnabled?: boolean
    lastDisasterEndRotation?: number
  } {
    return {
      activeDisasters: this.activeDisasters.map((d) => ({ ...d })),
      nextDisasterId: this.nextDisasterId,
      lastPulseRotation: this.lastPulseRotation,
      autoDisastersEnabled: this.autoDisastersEnabled,
      lastDisasterEndRotation: this.lastDisasterEndRotation,
    }
  }

  restoreState(
    state: {
      activeDisasters: readonly ActiveDisaster[]
      nextDisasterId: number
      lastPulseRotation: number
      autoDisastersEnabled?: boolean
      lastDisasterEndRotation?: number
    },
    currentRotation = 0
  ): void {
    this.activeDisasters = state.activeDisasters.map((d) => ({ ...d }))
    this.nextDisasterId = Math.max(1, state.nextDisasterId)
    this.lastPulseRotation = state.lastPulseRotation
    this.autoDisastersEnabled = state.autoDisastersEnabled ?? true
    this.lastDisasterEndRotation = state.lastDisasterEndRotation ?? currentRotation
    this.recalculatePerturbations(currentRotation)
  }
}

