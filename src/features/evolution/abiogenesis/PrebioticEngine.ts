import type { PlanetConfig } from '../../genesis/types/genesis.js'
import type { EnvironmentalPerturbations } from '../../disasters/types.js'
import { DEFAULT_PERTURBATIONS } from '../../disasters/constants.js'
import type { PrebioticState, LifeStage } from './types.js'
import type { Genotype } from '../genetics/types.js'
import { GeneExpression } from '../genetics/Gene.js'

export const DEFAULT_PREBIOTIC_STATE: PrebioticState = {
  stage: 'prebiotic',
  chemicalFertility: 0.0,
  organicComplexity: 0.0,
  waterViability: 0.0,
  organicAbundance: 0.0,
  catalystEnergy: 0.0,
  biogenesisReadiness: false,
  chemicalLineageArchetype: 'Progenitor Alpha',
  statusDescription: 'Sterile chemical elements awaiting prebiotic synthesis.',
}

export class PrebioticEngine {
  private stage: LifeStage = 'prebiotic'
  private organicComplexity = 0.0

  /**
   * Evaluates planetary chemical fertility from elemental, atmospheric, and thermal conditions.
   */
  evaluateChemistry(
    planetConfig: PlanetConfig,
    perturbations: EnvironmentalPerturbations = DEFAULT_PERTURBATIONS
  ): {
    waterViability: number
    organicAbundance: number
    catalystEnergy: number
    chemicalFertility: number
    archetype: string
  } {
    const effectiveTemp =
      planetConfig.surfaceTemperatureCelsius + perturbations.temperatureDeltaCelsius
    const effectiveOcean = Math.max(
      0.0,
      Math.min(1.0, planetConfig.oceanLevel + perturbations.oceanLevelDelta)
    )

    // 1. Liquid Water Solvent Viability
    // Water remains liquid between 0°C and 85°C at standard-to-dense pressures
    let tempSuitability = 0.0
    if (effectiveTemp >= 0 && effectiveTemp <= 85) {
      if (effectiveTemp >= 20 && effectiveTemp <= 55) {
        tempSuitability = 1.0 // Ideal biochemical reaction window
      } else if (effectiveTemp < 20) {
        tempSuitability = Math.max(0.1, effectiveTemp / 20.0)
      } else {
        tempSuitability = Math.max(0.1, (85.0 - effectiveTemp) / 30.0)
      }
    } else if (effectiveTemp < 0 && planetConfig.initialResources.geothermalEnergy > 50) {
      // Sub-glacial hydrothermal vents can still sustain prebiotic synthesis
      tempSuitability = Math.min(0.6, planetConfig.initialResources.geothermalEnergy / 100.0)
    }

    const waterViability = Math.max(
      0.0,
      Math.min(1.0, (effectiveOcean / 0.4) * tempSuitability)
    )

    // 2. Organic Building Blocks (Carbon, Nitrogen, Methane, Organics)
    const carbonPercent = planetConfig.elementalComposition.carbonOrganics
    const nitrogenPercent = planetConfig.atmosphericComposition.nitrogen
    const methanePercent = planetConfig.atmosphericComposition.methane
    const co2Percent = planetConfig.atmosphericComposition.carbonDioxide

    const organicScore =
      (carbonPercent / 18.0) * 0.45 +
      (nitrogenPercent / 80.0) * 0.25 +
      (methanePercent / 15.0) * 0.15 +
      (co2Percent / 20.0) * 0.15

    const organicAbundance = Math.max(0.05, Math.min(1.0, organicScore))

    // 3. Catalytic Energy (Geothermal heat, solar irradiance UV, mineral catalysts)
    const geoEnergy = planetConfig.initialResources.geothermalEnergy / 100.0
    const solarWatts = Math.min(1.0, planetConfig.initialResources.solarIrradianceWatts / 1400.0)
    const minerals = planetConfig.initialResources.mineralRichness / 100.0

    const catalystEnergy = Math.max(
      0.05,
      Math.min(1.0, geoEnergy * 0.45 + solarWatts * 0.3 + minerals * 0.25)
    )

    // 4. Composite Chemical Fertility
    const chemicalFertility = Number(
      (waterViability * 0.45 + organicAbundance * 0.35 + catalystEnergy * 0.2).toFixed(3)
    )

    // 5. Lineage Archetype Classification
    let archetype = 'Progenitor Alpha'
    if (planetConfig.initialResources.geothermalEnergy > 60 && methanePercent > 6.0) {
      archetype = 'Chemoarchaeon Primus' // Hydrothermal vent chemosynthetic lineage
    } else if (planetConfig.initialResources.solarIrradianceWatts > 1150 && waterViability > 0.6) {
      archetype = 'Protocyanophyta Sol' // Phototrophic aquatic lagoon lineage
    } else if (carbonPercent > 18.0 && planetConfig.initialResources.primordialBiomass > 45) {
      archetype = 'Coacervata Organica' // Dense organic primordial soup heterotroph
    } else if (planetConfig.environmentalConditions.radiationLevel === 'extreme') {
      archetype = 'Radiodurans Extremis' // Radiation-hardened lithotroph
    }

    return {
      waterViability: Number(waterViability.toFixed(3)),
      organicAbundance: Number(organicAbundance.toFixed(3)),
      catalystEnergy: Number(catalystEnergy.toFixed(3)),
      chemicalFertility,
      archetype,
    }
  }

  /**
   * Advances the prebiotic soup by one rotation.
   * Synthesizes complex organics when fertility is favorable.
   */
  step(
    _currentRotation: number,
    planetConfig: PlanetConfig,
    perturbations: EnvironmentalPerturbations = DEFAULT_PERTURBATIONS
  ): PrebioticState {
    const chemistry = this.evaluateChemistry(planetConfig, perturbations)

    // Prebiotic synthesis active during primordial dawn or post-extinction recovery
    if (this.stage === 'prebiotic' || this.stage === 'extinct') {
      const isViable =
        chemistry.waterViability > 0.1 &&
        chemistry.organicAbundance > 0.1 &&
        chemistry.chemicalFertility >= 0.15

      if (isViable) {
        // Prebiotic synthesis rate scaled by chemical fertility (well-balanced natural pace)
        const synthesisRate = chemistry.chemicalFertility * 0.06
        this.organicComplexity = Math.min(1.0, this.organicComplexity + synthesisRate)
      } else {
        // Hostile planetary conditions degrade organic soup
        this.organicComplexity = Math.max(0.0, this.organicComplexity - 0.02)
      }
    }

    const biogenesisReadiness = this.organicComplexity >= 0.25
    let statusDescription = 'Sterile chemical elements awaiting prebiotic synthesis.'

    if (this.stage === 'prebiotic') {
      if (this.organicComplexity >= 1.0) {
        statusDescription = `Primordial soup saturated (100%). Spontaneous biogenesis imminent for ${chemistry.archetype}!`
      } else if (this.organicComplexity >= 0.6) {
        statusDescription = `Complex macromolecules and lipid vesicles synthesizing (${(this.organicComplexity * 100).toFixed(0)}%).`
      } else if (this.organicComplexity >= 0.25) {
        statusDescription = `Amino acids and nucleobases dissolved in primordial soup (${(this.organicComplexity * 100).toFixed(0)}%).`
      } else if (chemistry.chemicalFertility < 0.2) {
        statusDescription = 'Chemical synthesis hindered by hostile temperature or solvent scarcity.'
      } else {
        statusDescription = `Prebiotic chemical reaction initiated (${(this.organicComplexity * 100).toFixed(0)}%).`
      }
    } else if (this.stage === 'inhabited') {
      statusDescription = `Biosphere flourishing. Lineage established from ${chemistry.archetype}.`
    } else if (this.stage === 'extinct') {
      const isViable =
        chemistry.waterViability > 0.1 &&
        chemistry.organicAbundance > 0.1 &&
        chemistry.chemicalFertility >= 0.15

      if (this.organicComplexity >= 1.0) {
        statusDescription = `Post-extinction chemical soup saturated (100%). Resurgence of new life imminent for ${chemistry.archetype}!`
      } else if (isViable) {
        statusDescription = `Environmental conditions viable. Secondary prebiotic synthesis in progress (${(this.organicComplexity * 100).toFixed(0)}%).`
      } else {
        statusDescription = 'All biological populations extinct. Hostile environment preventing secondary biogenesis.'
      }
    }

    return {
      stage: this.stage,
      chemicalFertility: chemistry.chemicalFertility,
      organicComplexity: Number(this.organicComplexity.toFixed(3)),
      waterViability: chemistry.waterViability,
      organicAbundance: chemistry.organicAbundance,
      catalystEnergy: chemistry.catalystEnergy,
      biogenesisReadiness,
      chemicalLineageArchetype: chemistry.archetype,
      statusDescription,
    }
  }

  /**
   * Generates the primordial genotype derived directly from planetary chemical profile.
   */
  generatePrimordialGenotype(
    planetConfig: PlanetConfig,
    archetype: string
  ): Genotype {
    // 1. Thermal Optimum: derived from surface temperature and biogenesis niche
    let tempOptimumLocus = Math.max(
      0.0,
      Math.min(1.0, (planetConfig.surfaceTemperatureCelsius + 40) / 120.0)
    )

    // Hydrothermal vent organisms specialize in hot thermal niches
    if (archetype === 'Chemoarchaeon Primus') {
      tempOptimumLocus = Math.max(tempOptimumLocus, 0.72) // ~46°C to 65°C
    }

    // 2. Water Conservation: inversely proportional to ocean abundance
    const waterLocus = Math.max(0.1, Math.min(0.9, 1.0 - planetConfig.oceanLevel * 0.8))

    // 3. Metabolic Efficiency: high oxygen favors aerobic efficiency, methane favors specialized anaerobes
    let metabolicLocus = 0.4
    if (planetConfig.atmosphericComposition.oxygen > 15.0) {
      metabolicLocus = 0.65 // Aerobic respiration
    } else if (archetype === 'Chemoarchaeon Primus') {
      metabolicLocus = 0.35 // Basal chemosynthesis
    }

    // 4. Structural Armor: mineral richness and radiation tolerance
    let armorLocus = 0.4
    if (planetConfig.environmentalConditions.radiationLevel === 'extreme' || archetype === 'Radiodurans Extremis') {
      armorLocus = 0.85
    } else if (planetConfig.initialResources.mineralRichness > 60) {
      armorLocus = 0.6
    }

    return {
      genes: {
        thermalOptimum: GeneExpression.createGene('thermalOptimum', tempOptimumLocus, 'dominant'),
        thermalRange: GeneExpression.createGene('thermalRange', 0.5, 'dominant'),
        waterConservation: GeneExpression.createGene('waterConservation', waterLocus, 'dominant'),
        metabolicEfficiency: GeneExpression.createGene('metabolicEfficiency', metabolicLocus, 'dominant'),
        reproductiveInvestment: GeneExpression.createGene('reproductiveInvestment', 0.45, 'dominant'),
        structuralArmor: GeneExpression.createGene('structuralArmor', armorLocus, 'dominant'),
        mobilityFactor: GeneExpression.createGene('mobilityFactor', 0.35, 'dominant'),
      },
    }
  }

  setStage(stage: LifeStage): void {
    this.stage = stage
  }

  getStage(): LifeStage {
    return this.stage
  }

  getOrganicComplexity(): number {
    return this.organicComplexity
  }

  setOrganicComplexity(complexity: number): void {
    this.organicComplexity = Math.max(0.0, Math.min(1.0, complexity))
  }

  reset(): void {
    this.stage = 'prebiotic'
    this.organicComplexity = 0.0
  }

  exportState(): {
    stage: LifeStage
    organicComplexity: number
  } {
    return {
      stage: this.stage,
      organicComplexity: this.organicComplexity,
    }
  }

  restoreState(state: {
    stage: LifeStage
    organicComplexity: number
  }): void {
    this.stage = state.stage
    this.organicComplexity = Math.max(0, Math.min(100, state.organicComplexity))
  }
}
