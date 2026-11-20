import type { PlanetConfig } from '../../genesis/types/genesis.js'
import type { EnvironmentalPerturbations } from '../../disasters/types.js'
import { DEFAULT_PERTURBATIONS } from '../../disasters/constants.js'
import type {
  PrebioticState,
  LifeStage,
  MacroEvolutionEra,
  ProtocellForm,
  ChemicalEvolutionPhase,
  ChemicalCatalystType,
} from './types.js'
import type { Genotype } from '../genetics/types.js'
import { GeneExpression } from '../genetics/Gene.js'

export const DEFAULT_PREBIOTIC_STATE: PrebioticState = {
  stage: 'prebiotic',
  macroEra: 'chemical_evolution',
  macroEraLabel: 'Kỷ I: Tiến Hóa Hóa Học (Monomer & Hợp chất cơ bản)',
  protocellForm: 'lipid_coacervate',
  protocellFormLabel: 'Nguyên bào Màng Lipid Coacervate',
  protocellComplexity: 0.0,
  protoMetabolismRate: 0.0,
  chemicalFertility: 0.0,
  organicComplexity: 0.0,
  waterViability: 0.0,
  organicAbundance: 0.0,
  catalystEnergy: 0.0,
  biogenesisReadiness: false,
  chemicalLineageArchetype: 'Progenitor Alpha',
  statusDescription: 'Sterile chemical elements awaiting prebiotic synthesis.',
  chemicalPhase: 'monomer_synthesis',
  chemicalPhaseLabel: 'Nấc I: Tổng hợp Monomer Vô cơ',
  monomerConcentration: 0.0,
  polymerComplexity: 0.0,
  protocellStability: 0.0,
  organicPoolVolume: 0.0,
  bioticFeedbackFlux: 0.0,
  deNovoSynthesisReady: false,
  lastCatalystApplied: null,
}

export class PrebioticEngine {
  private stage: LifeStage = 'prebiotic'
  private organicComplexity = 0.0
  private monomerConcentration = 0.0
  private polymerComplexity = 0.0
  private protocellStability = 0.0
  private organicPoolVolume = 0.0
  private bioticFeedbackFlux = 0.0
  private deNovoSynthesisReady = false
  private lastCatalystApplied: ChemicalCatalystType | null = null

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
   * Triggers an atmospheric lightning spark intervention (Miller-Urey synthesis).
   * Surges monomer synthesis from planetary gases.
   */
  catalyzeSpark(): void {
    this.monomerConcentration = Math.min(1.0, this.monomerConcentration + 0.22)
    this.organicPoolVolume = Math.min(1.0, this.organicPoolVolume + 0.15)
    this.organicComplexity = Math.min(
      1.0,
      this.organicComplexity + 0.12
    )
    this.lastCatalystApplied = 'spark'
  }

  /**
   * Triggers an alkaline hydrothermal vent venting pulse.
   * Accelerates peptide/RNA polymerization and protocell membrane stability.
   */
  catalyzeVent(): void {
    this.polymerComplexity = Math.min(1.0, this.polymerComplexity + 0.2)
    this.protocellStability = Math.min(1.0, this.protocellStability + 0.2)
    this.organicPoolVolume = Math.min(1.0, this.organicPoolVolume + 0.15)
    this.organicComplexity = Math.min(
      1.0,
      this.organicComplexity + 0.15
    )
    this.lastCatalystApplied = 'vent'
  }

  /**
   * Advances chemical evolution by one planetary rotation.
   * Runs continuously in parallel before, during, and after biological life is present.
   */
  step(
    _currentRotation: number,
    planetConfig: PlanetConfig,
    perturbations: EnvironmentalPerturbations = DEFAULT_PERTURBATIONS,
    totalBiomass = 0,
    activeSpeciesCount = 0
  ): PrebioticState {
    const chemistry = this.evaluateChemistry(planetConfig, perturbations)
    const isViable =
      chemistry.waterViability > 0.1 &&
      chemistry.organicAbundance > 0.1 &&
      chemistry.chemicalFertility >= 0.15

    let statusDescription = 'Sterile chemical elements awaiting prebiotic synthesis.'

    // =========================================================================
    // Era 1: Prebiotic Dawn
    // =========================================================================
    if (this.stage === 'prebiotic') {
      if (isViable) {
        // Step 1: Monomer synthesis from atmospheric gases & geothermal energy
        const monomerRate = chemistry.chemicalFertility * 0.08
        this.monomerConcentration = Math.min(1.0, this.monomerConcentration + monomerRate)

        // Step 2: Polymer chains (RNA World / peptides) form as monomers concentrate
        if (this.monomerConcentration >= 0.2) {
          const polymerRate = this.monomerConcentration * chemistry.catalystEnergy * 0.07
          this.polymerComplexity = Math.min(1.0, this.polymerComplexity + polymerRate)
        }

        // Step 3: Lipid membrane vesicles & protocells assemble around polymers
        if (this.polymerComplexity >= 0.25) {
          const protocellRate = this.polymerComplexity * chemistry.waterViability * 0.06
          this.protocellStability = Math.min(1.0, this.protocellStability + protocellRate)
        }

        // Primordial organic reservoir volume
        this.organicPoolVolume = Math.min(
          1.0,
          this.monomerConcentration * 0.4 +
            this.polymerComplexity * 0.35 +
            this.protocellStability * 0.25
        )

        this.organicComplexity = Number(
          (
            this.monomerConcentration * 0.35 +
            this.polymerComplexity * 0.35 +
            this.protocellStability * 0.3
          ).toFixed(3)
        )
      } else {
        // Hostile planetary conditions degrade organic soup
        this.monomerConcentration = Math.max(0.0, this.monomerConcentration - 0.015)
        this.polymerComplexity = Math.max(0.0, this.polymerComplexity - 0.02)
        this.protocellStability = Math.max(0.0, this.protocellStability - 0.025)
        this.organicComplexity = Math.max(0.0, this.organicComplexity - 0.02)
      }

      this.deNovoSynthesisReady = false

      if (this.organicComplexity >= 1.0) {
        statusDescription = `Primordial soup saturated (100%). Spontaneous biogenesis imminent for ${chemistry.archetype}!`
      } else if (this.protocellStability >= 0.6) {
        statusDescription = `Coacervate droplets and lipid vesicles self-assembling (${(this.organicComplexity * 100).toFixed(0)}%).`
      } else if (this.polymerComplexity >= 0.35) {
        statusDescription = `RNA World: Macromolecular peptide and oligonucleotide chains polymerizing (${(this.organicComplexity * 100).toFixed(0)}%).`
      } else if (this.monomerConcentration >= 0.25) {
        statusDescription = `Amino acids, sugars, and nucleobases dissolved in primordial soup (${(this.organicComplexity * 100).toFixed(0)}%).`
      } else if (chemistry.chemicalFertility < 0.2) {
        statusDescription = 'Chemical synthesis hindered by hostile temperature or solvent scarcity.'
      } else {
        statusDescription = `Prebiotic chemical reaction initiated (${(this.organicComplexity * 100).toFixed(0)}%).`
      }
    }

    // =========================================================================
    // Era 2: Inhabited Biosphere (Continuous Parallel Chemical Flux)
    // =========================================================================
    else if (this.stage === 'inhabited') {
      // 1. Biotic feedback flux from active biomass, cellular shedding, and mortality
      this.bioticFeedbackFlux = Math.min(
        1.0,
        (totalBiomass / 350.0) * 0.5 + (activeSpeciesCount / 4.0) * 0.5
      )

      // 2. Abiotic geochemical synthesis continues in vents, oceans, and atmosphere
      const naturalSynthesis = chemistry.chemicalFertility * 0.04
      // Living organisms consume monomers while cellular excretion & decomposition returns carbon
      this.monomerConcentration = Math.max(
        0.15,
        Math.min(
          1.0,
          this.monomerConcentration + naturalSynthesis + this.bioticFeedbackFlux * 0.025 - 0.008
        )
      )

      // Catalytic polymer synthesis on deep-sea hydrothermal minerals & sediment
      this.polymerComplexity = Math.max(
        0.2,
        Math.min(1.0, this.polymerComplexity + chemistry.catalystEnergy * 0.035)
      )

      // Protocell stability sustained in benthic micro-environments
      this.protocellStability = Math.max(
        0.2,
        Math.min(1.0, this.protocellStability + chemistry.waterViability * 0.035)
      )

      // Global organic pool dynamically balances biotic output and abiotic weathering
      this.organicPoolVolume = Math.max(
        0.2,
        Math.min(
          1.0,
          this.organicPoolVolume * 0.98 +
            (this.bioticFeedbackFlux * 0.4 +
              this.monomerConcentration * 0.3 +
              this.polymerComplexity * 0.3) *
              0.04
        )
      )

      this.organicComplexity = Number(
        Math.max(
          0.5,
          this.monomerConcentration * 0.25 +
            this.polymerComplexity * 0.25 +
            this.protocellStability * 0.25 +
            this.organicPoolVolume * 0.25
        ).toFixed(3)
      )

      // 3. De Novo Microbial Genesis check:
      // When abiotic synthesis and organic pools reach super-saturation in a living world,
      // a brand new de novo strain can spontaneously synthesize!
      this.deNovoSynthesisReady =
        this.organicPoolVolume >= 0.65 &&
        this.protocellStability >= 0.6 &&
        this.monomerConcentration >= 0.55

      statusDescription = `Biosphere flourishing. Lineage established from ${chemistry.archetype}. Parallel chemical synthesis flux: ${(this.organicPoolVolume * 100).toFixed(0)}% organic reservoir.`
    }

    // =========================================================================
    // Era 3: Extinct World (Post-Extinction Secondary Synthesis)
    // =========================================================================
    else if (this.stage === 'extinct') {
      // Deceased biomass seeds an extensive organic residue pool
      this.organicPoolVolume = Math.max(0.35, this.organicPoolVolume)
      this.bioticFeedbackFlux = 0.0
      this.deNovoSynthesisReady = false

      if (isViable) {
        // Accelerated secondary prebiotic synthesis aided by residual organics
        this.monomerConcentration = Math.min(
          1.0,
          this.monomerConcentration + chemistry.chemicalFertility * 0.07
        )
        this.polymerComplexity = Math.min(
          1.0,
          this.polymerComplexity + 0.06 * chemistry.catalystEnergy
        )
        this.protocellStability = Math.min(
          1.0,
          this.protocellStability + 0.05 * chemistry.waterViability
        )

        this.organicComplexity = Number(
          (
            this.monomerConcentration * 0.35 +
            this.polymerComplexity * 0.35 +
            this.protocellStability * 0.3
          ).toFixed(3)
        )

        if (this.organicComplexity >= 1.0) {
          statusDescription = `Post-extinction chemical soup saturated (100%). Resurgence of new microbial life imminent for ${chemistry.archetype}!`
        } else {
          statusDescription = `Environmental conditions viable. Secondary prebiotic synthesis in progress (${(this.organicComplexity * 100).toFixed(0)}%). Tự động khởi sinh dòng vi sinh mới!`
        }
      } else {
        this.monomerConcentration = Math.max(0.05, this.monomerConcentration - 0.01)
        this.polymerComplexity = Math.max(0.05, this.polymerComplexity - 0.015)
        this.protocellStability = Math.max(0.05, this.protocellStability - 0.02)
        this.organicComplexity = Math.max(0.0, this.organicComplexity - 0.02)
        statusDescription =
          'All biological populations extinct. Hostile environment preventing secondary biogenesis.'
      }
    }

    // Determine Protocell Architecture based on planetary conditions
    const effectiveTemp =
      planetConfig.surfaceTemperatureCelsius + perturbations.temperatureDeltaCelsius
    const effectiveOcean = Math.max(
      0.0,
      Math.min(1.0, planetConfig.oceanLevel + perturbations.oceanLevelDelta)
    )
    const silicates = planetConfig.elementalComposition.silicatesRock
    const carbonOrganics = planetConfig.elementalComposition.carbonOrganics
    const radLevel = planetConfig.environmentalConditions.radiationLevel
    const pressure = planetConfig.atmosphericComposition.pressureAtm

    let protocellForm: ProtocellForm = 'lipid_coacervate'
    let protocellFormLabel = 'Nguyên bào Màng Lipid Coacervate'

    if (effectiveTemp < -10) {
      protocellForm = 'azotosome_cryo'
      protocellFormLabel = 'Nguyên bào Azotosome Mê-tan Siêu hàn'
    } else if (
      (silicates > 75 && carbonOrganics < 10) ||
      radLevel === 'extreme' ||
      effectiveTemp > 55
    ) {
      protocellForm = 'silico_vesicle'
      protocellFormLabel = 'Nguyên bào Bọc Tinh thể Silic Áp điện'
    } else if (pressure > 1.8 && effectiveOcean < 0.2) {
      protocellForm = 'aerosol_droplet'
      protocellFormLabel = 'Nguyên bào Giọt Sương Khí quyển Đối lưu'
    } else if (
      planetConfig.initialResources.geothermalEnergy > 75 ||
      (effectiveOcean < 0.15 && planetConfig.initialResources.geothermalEnergy > 60)
    ) {
      protocellForm = 'iron_sulfur_bubble'
      protocellFormLabel = 'Nguyên bào Bọt Sắt-Lưu huỳnh Thủy nhiệt'
    }

    // Determine current chemical phase & localized label
    let chemicalPhase: ChemicalEvolutionPhase = 'monomer_synthesis'
    let chemicalPhaseLabel = 'Nấc I: Tổng hợp Monomer Vô cơ'

    if (this.stage === 'inhabited') {
      chemicalPhase = 'biogeochemical_flux'
      chemicalPhaseLabel = 'Nấc V: Tuần hoàn Hóa sinh quyển Đồng Tiến hóa'
    } else if (this.protocellStability >= 0.65) {
      chemicalPhase = 'microbial_emergence'
      chemicalPhaseLabel = 'Nấc IV: Khởi sinh Vi sinh vật Sơ khai'
    } else if (this.polymerComplexity >= 0.4) {
      chemicalPhase = 'protocell_assembly'
      chemicalPhaseLabel = 'Nấc III: Lắp ráp Màng & Tiền tế bào'
    } else if (this.monomerConcentration >= 0.3) {
      chemicalPhase = 'polymer_formation'
      chemicalPhaseLabel = 'Nấc II: Hình thành Polyme & RNA World'
    }

    // Determine Grand Evolutionary Macro-Era
    let macroEra: MacroEvolutionEra = 'chemical_evolution'
    let macroEraLabel = 'Kỷ I: Tiến Hóa Hóa Học (Monomer & Hợp chất cơ bản)'

    if (this.stage === 'inhabited') {
      macroEra = 'biological_evolution'
      macroEraLabel = 'Kỷ III: Tiến Hóa Sinh Học (Rẽ nhánh phi Trái Đất)'
    } else if (
      this.protocellStability >= 0.15 ||
      this.polymerComplexity >= 0.15 ||
      this.organicComplexity >= 0.2
    ) {
      macroEra = 'prebiological_evolution'
      macroEraLabel = 'Kỷ II: Tiến Hóa Tiền Sinh Học (Nguyên bào / Tế bào sơ khai)'
    }

    const protocellComplexity = Number(
      Math.min(1.0, this.protocellStability * 0.6 + this.polymerComplexity * 0.4).toFixed(3)
    )
    const protoMetabolismRate = Number(
      Math.min(1.0, chemistry.catalystEnergy * 0.5 + this.monomerConcentration * 0.5).toFixed(3)
    )

    const biogenesisReadiness = this.organicComplexity >= 0.25

    return {
      stage: this.stage,
      macroEra,
      macroEraLabel,
      protocellForm,
      protocellFormLabel,
      protocellComplexity,
      protoMetabolismRate,
      chemicalFertility: chemistry.chemicalFertility,
      organicComplexity: Number(this.organicComplexity.toFixed(3)),
      waterViability: chemistry.waterViability,
      organicAbundance: chemistry.organicAbundance,
      catalystEnergy: chemistry.catalystEnergy,
      biogenesisReadiness,
      chemicalLineageArchetype: chemistry.archetype,
      statusDescription,
      chemicalPhase,
      chemicalPhaseLabel,
      monomerConcentration: Number(this.monomerConcentration.toFixed(3)),
      polymerComplexity: Number(this.polymerComplexity.toFixed(3)),
      protocellStability: Number(this.protocellStability.toFixed(3)),
      organicPoolVolume: Number(this.organicPoolVolume.toFixed(3)),
      bioticFeedbackFlux: Number(this.bioticFeedbackFlux.toFixed(3)),
      deNovoSynthesisReady: this.deNovoSynthesisReady,
      lastCatalystApplied: this.lastCatalystApplied,
    }
  }

  /**
   * Generates the primordial genotype derived directly from planetary chemical profile.
   */
  generatePrimordialGenotype(planetConfig: PlanetConfig, archetype: string): Genotype {
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
    if (
      planetConfig.environmentalConditions.radiationLevel === 'extreme' ||
      archetype === 'Radiodurans Extremis'
    ) {
      armorLocus = 0.85
    } else if (planetConfig.initialResources.mineralRichness > 60) {
      armorLocus = 0.6
    }

    return {
      genes: {
        thermalOptimum: GeneExpression.createGene('thermalOptimum', tempOptimumLocus, 'dominant'),
        thermalRange: GeneExpression.createGene('thermalRange', 0.5, 'dominant'),
        waterConservation: GeneExpression.createGene('waterConservation', waterLocus, 'dominant'),
        metabolicEfficiency: GeneExpression.createGene(
          'metabolicEfficiency',
          metabolicLocus,
          'dominant'
        ),
        reproductiveInvestment: GeneExpression.createGene(
          'reproductiveInvestment',
          0.45,
          'dominant'
        ),
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

  getMonomerConcentration(): number {
    return this.monomerConcentration
  }

  setMonomerConcentration(value: number): void {
    this.monomerConcentration = Math.max(0.0, Math.min(1.0, value))
  }

  getPolymerComplexity(): number {
    return this.polymerComplexity
  }

  setPolymerComplexity(value: number): void {
    this.polymerComplexity = Math.max(0.0, Math.min(1.0, value))
  }

  getProtocellStability(): number {
    return this.protocellStability
  }

  setProtocellStability(value: number): void {
    this.protocellStability = Math.max(0.0, Math.min(1.0, value))
  }

  getOrganicPoolVolume(): number {
    return this.organicPoolVolume
  }

  setOrganicPoolVolume(value: number): void {
    this.organicPoolVolume = Math.max(0.0, Math.min(1.0, value))
  }

  getDeNovoSynthesisReady(): boolean {
    return this.deNovoSynthesisReady
  }

  getBiogenesisReadiness(): boolean {
    return this.organicComplexity >= 0.25
  }

  consumeDeNovoBiogenesis(): void {
    this.protocellStability = 0.35
    this.organicPoolVolume = 0.4
    this.deNovoSynthesisReady = false
  }

  reset(): void {
    this.stage = 'prebiotic'
    this.organicComplexity = 0.0
    this.monomerConcentration = 0.0
    this.polymerComplexity = 0.0
    this.protocellStability = 0.0
    this.organicPoolVolume = 0.0
    this.bioticFeedbackFlux = 0.0
    this.deNovoSynthesisReady = false
    this.lastCatalystApplied = null
  }

  exportState(): {
    stage: LifeStage
    organicComplexity: number
    monomerConcentration: number
    polymerComplexity: number
    protocellStability: number
    organicPoolVolume: number
    bioticFeedbackFlux: number
    deNovoSynthesisReady: boolean
  } {
    return {
      stage: this.stage,
      organicComplexity: this.organicComplexity,
      monomerConcentration: this.monomerConcentration,
      polymerComplexity: this.polymerComplexity,
      protocellStability: this.protocellStability,
      organicPoolVolume: this.organicPoolVolume,
      bioticFeedbackFlux: this.bioticFeedbackFlux,
      deNovoSynthesisReady: this.deNovoSynthesisReady,
    }
  }

  restoreState(state: {
    stage: LifeStage
    organicComplexity: number
    monomerConcentration?: number
    polymerComplexity?: number
    protocellStability?: number
    organicPoolVolume?: number
    bioticFeedbackFlux?: number
    deNovoSynthesisReady?: boolean
  }): void {
    this.stage = state.stage
    this.organicComplexity = Math.max(0, Math.min(1.0, state.organicComplexity))
    this.monomerConcentration = Math.max(0, Math.min(1.0, state.monomerConcentration ?? 0))
    this.polymerComplexity = Math.max(0, Math.min(1.0, state.polymerComplexity ?? 0))
    this.protocellStability = Math.max(0, Math.min(1.0, state.protocellStability ?? 0))
    this.organicPoolVolume = Math.max(0, Math.min(1.0, state.organicPoolVolume ?? 0))
    this.bioticFeedbackFlux = Math.max(0, Math.min(1.0, state.bioticFeedbackFlux ?? 0))
    this.deNovoSynthesisReady = state.deNovoSynthesisReady ?? false
  }
}
