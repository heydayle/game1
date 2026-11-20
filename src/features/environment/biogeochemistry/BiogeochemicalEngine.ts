import type {
  AtmosphericComposition,
  ElementalComposition,
  PlanetConfig,
} from '../../genesis/types/genesis.js'
import type { EnvironmentalPerturbations } from '../../disasters/types.js'
import { DEFAULT_PERTURBATIONS } from '../../disasters/constants.js'
import type { SpeciesSummary } from '../../evolution/genetics/types.js'
import type {
  BiogeochemicalState,
  CompositionTrends,
  GasTrend,
} from './types.js'

export class BiogeochemicalEngine {
  // Accumulated biogenic shifts
  private biogenicOxygen = 0.0
  private biogenicCarbonFixed = 0.0
  private biogenicMethane = 0.0
  private oceanDissolvedIron = 100.0 // Percentage [0.0, 100.0]%
  private totalBifDeposited = 0.0

  // History tracking for trend calculations (last 4 samples)
  private o2History: number[] = []
  private co2History: number[] = []
  private ch4History: number[] = []
  private h2oHistory: number[] = []
  private cOrgHistory: number[] = []

  /**
   * Resets engine to initial planetary chemical state.
   */
  reset(planetConfig?: PlanetConfig): void {
    this.biogenicOxygen = 0.0
    this.biogenicCarbonFixed = 0.0
    this.biogenicMethane = 0.0
    this.oceanDissolvedIron = 100.0
    this.totalBifDeposited = 0.0
    this.o2History = []
    this.co2History = []
    this.ch4History = []
    this.h2oHistory = []
    this.cOrgHistory = []

    if (planetConfig) {
      const o2 = planetConfig.atmosphericComposition.oxygen
      const co2 = planetConfig.atmosphericComposition.carbonDioxide
      const ch4 = planetConfig.atmosphericComposition.methane
      const h2o = planetConfig.atmosphericComposition.waterVapor
      const cOrg = planetConfig.elementalComposition.carbonOrganics
      this.o2History = [o2, o2]
      this.co2History = [co2, co2]
      this.ch4History = [ch4, ch4]
      this.h2oHistory = [h2o, h2o]
      this.cOrgHistory = [cOrg, cOrg]
    }
  }

  /**
   * Evaluates dynamic planetary atmospheric and elemental composition for the current rotation.
   */
  step(
    rotations: number,
    partialRotation: number,
    planetConfig: PlanetConfig,
    totalPopulation: number,
    speciesSummaries: readonly SpeciesSummary[] = [],
    perturbations: EnvironmentalPerturbations = DEFAULT_PERTURBATIONS
  ): BiogeochemicalState {
    const baseAtm = planetConfig.atmosphericComposition
    const baseElem = planetConfig.elementalComposition

    // 1. Orbital & Rotational Dynamics (Diurnal and Seasonal Oscillations)
    // Diurnal insolation oscillation from planetary spin
    const rotationProgress = (rotations + partialRotation) * 2 * Math.PI
    const diurnalVaporFlux = Math.sin(rotationProgress) * 0.35

    // Seasonal insolation cycle from axial tilt
    const seasonalProgress = ((rotations % 120) / 120) * 2 * Math.PI
    const tiltFactor = planetConfig.axialTiltDeg / 23.5
    const seasonalVaporFlux = Math.sin(seasonalProgress) * 0.45 * tiltFactor

    // 2. Biological Flux Dynamics
    let o2ProductionRate = 0.0
    let co2RespirationRate = 0.0
    let carbonFixationRate = 0.0
    let methanogenesisRate = 0.0

    if (totalPopulation > 0) {
      // Scale population influence logarithmically so billions don't blow up percentages
      const popScaling = Math.min(1.0, Math.log10(Math.max(10, totalPopulation)) / 6.0)

      // Light availability for autotrophs (reduced by volcanic soot & asteroid dust)
      const sunlightAvailability = Math.max(0.05, 1.0 - perturbations.atmosphericDust * 1.2)

      // Photosynthetic / Chemosynthetic Oxygen Generation
      // Autotrophic lineages release O2 while fixing atmospheric carbon
      o2ProductionRate = 0.08 * popScaling * sunlightAvailability
      carbonFixationRate = 0.06 * popScaling * sunlightAvailability

      // Geochemical ocean iron sink (Fe2+): absorbs O2 to form Banded Iron Formations (BIF)
      let atmosphericO2Flux = o2ProductionRate
      if (this.oceanDissolvedIron > 0) {
        const ironDepletion = Math.min(this.oceanDissolvedIron, o2ProductionRate * 3.0)
        this.oceanDissolvedIron = Math.max(0.0, this.oceanDissolvedIron - ironDepletion)
        this.totalBifDeposited += ironDepletion
        // As long as ocean dissolved iron remains abundant, 85% of produced oxygen is sequestered into BIF
        const ironRetentionFactor = 0.15 + 0.85 * (1.0 - this.oceanDissolvedIron / 100.0)
        atmosphericO2Flux = o2ProductionRate * ironRetentionFactor
      }

      // Basal metabolic respiration consumes O2 (limited by ambient oxygen in anoxic worlds)
      const currentAmbientO2 = Math.max(0.0, baseAtm.oxygen + this.biogenicOxygen)
      const o2Availability = Math.min(1.0, currentAmbientO2 / 2.0)
      const avgResilience =
        speciesSummaries.length > 0
          ? speciesSummaries.reduce((acc, s) => acc + s.dominantTraits.resilience, 0) /
            speciesSummaries.length
          : 0.5
      co2RespirationRate = 0.04 * popScaling * (0.8 + 0.4 * avgResilience)
      const o2ConsumedByRespiration = co2RespirationRate * o2Availability * 0.5

      // Anaerobic methanogenesis flourishes when oxygen is still primitive/anoxic
      if (baseAtm.oxygen + this.biogenicOxygen < 8.0) {
        methanogenesisRate = 0.05 * popScaling * Math.max(0.1, 1.0 - perturbations.atmosphericDust)
      } else {
        // High oxygen chemically photolyzes / oxidizes free methane (CH4 + 2O2 -> CO2 + 2H2O)
        methanogenesisRate = -0.04 * popScaling
      }

      // Accumulate biogenic shift (smooth saturation curves)
      this.biogenicOxygen = Math.max(
        -baseAtm.oxygen * 0.8,
        Math.min(32.0 - baseAtm.oxygen, this.biogenicOxygen + (atmosphericO2Flux - o2ConsumedByRespiration))
      )
      this.biogenicCarbonFixed = Math.max(
        0.0,
        Math.min(18.0, this.biogenicCarbonFixed + carbonFixationRate * 0.3)
      )
      this.biogenicMethane = Math.max(
        -baseAtm.methane * 0.9,
        Math.min(12.0, this.biogenicMethane + methanogenesisRate)
      )
    }

    // 3. Planetary Disaster Perturbations
    // Supervolcano: massive CO2 outgassing surge, sulfur ash
    let disasterCO2Surge = 0.0
    let disasterDustVaporDrawdown = 0.0
    let solarPhotolysisMethaneLoss = 0.0

    if (perturbations.atmosphericDust > 0.1) {
      disasterCO2Surge += perturbations.atmosphericDust * 8.5
      disasterDustVaporDrawdown -= perturbations.atmosphericDust * 1.8
    }

    if (perturbations.temperatureDeltaCelsius < -5) {
      // Ice Age freezes atmospheric water vapor into polar sheets
      const glaciationSeverity = Math.abs(perturbations.temperatureDeltaCelsius) / 25.0
      disasterDustVaporDrawdown -= Math.min(3.5, glaciationSeverity * 2.8)
    } else if (perturbations.temperatureDeltaCelsius > 5) {
      // Extreme greenhouse surge increases ocean thermal evaporation
      disasterDustVaporDrawdown += Math.min(3.0, (perturbations.temperatureDeltaCelsius / 20.0) * 2.2)
    }

    if (perturbations.radiationMultiplier > 2.0) {
      // Solar flare UV ionization photolyzes atmospheric methane and ionizes upper atmosphere
      solarPhotolysisMethaneLoss = Math.min(
        4.0,
        (perturbations.radiationMultiplier - 1.0) * 0.8
      )
    }

    // 4. Compute Raw Gas Weights
    let rawO2 = Math.max(0.01, baseAtm.oxygen + this.biogenicOxygen)
    let rawCO2 = Math.max(
      0.01,
      baseAtm.carbonDioxide - this.biogenicCarbonFixed * 0.4 + disasterCO2Surge + co2RespirationRate * 2.0
    )
    let rawCH4 = Math.max(
      0.01,
      baseAtm.methane + this.biogenicMethane - solarPhotolysisMethaneLoss
    )
    let rawH2O = Math.max(
      0.05,
      baseAtm.waterVapor + diurnalVaporFlux + seasonalVaporFlux + disasterDustVaporDrawdown
    )
    let rawNoble = baseAtm.nobleGases
    let rawN2 = baseAtm.nitrogen

    // Normalize Atmospheric Gases to exact 100.00%
    const totalGasWeight = rawO2 + rawCO2 + rawCH4 + rawH2O + rawNoble + rawN2
    const oxygen = Number(((rawO2 / totalGasWeight) * 100).toFixed(2))
    const carbonDioxide = Number(((rawCO2 / totalGasWeight) * 100).toFixed(2))
    const methane = Number(((rawCH4 / totalGasWeight) * 100).toFixed(2))
    const waterVapor = Number(((rawH2O / totalGasWeight) * 100).toFixed(2))
    const nobleGases = Number(((rawNoble / totalGasWeight) * 100).toFixed(2))
    const nitrogen = Number(
      (100.0 - (oxygen + carbonDioxide + methane + waterVapor + nobleGases)).toFixed(2)
    )

    // Dynamic Pressure modulated by outgassing and temperature
    const pressureAtm = Number(
      Math.max(
        0.1,
        baseAtm.pressureAtm * (1.0 + (disasterCO2Surge * 0.04) - (disasterDustVaporDrawdown * 0.02))
      ).toFixed(2)
    )

    const atmospheric: AtmosphericComposition = {
      nitrogen,
      oxygen,
      carbonDioxide,
      methane,
      waterVapor,
      nobleGases,
      pressureAtm,
    }

    // 5. Compute Elemental Composition (Exact 100.0% normalization)
    // Organic carbon increases as biomass fixes atmospheric carbon into crust
    const organicCarbonBonus = this.biogenicCarbonFixed * 0.5
    const rawSilicates = Math.max(20.0, baseElem.silicatesRock - organicCarbonBonus * 0.3)
    const rawIron = Math.max(10.0, baseElem.ironMetals - (oxygen > 12 ? 1.5 : 0.0)) // Banded iron formation
    const rawVolatiles = Math.max(5.0, baseElem.waterVolatiles - diurnalVaporFlux * 0.1)
    const rawOrganics = Math.max(0.1, baseElem.carbonOrganics + organicCarbonBonus)

    const totalElemWeight = rawSilicates + rawIron + rawVolatiles + rawOrganics
    const silicatesRock = Number(((rawSilicates / totalElemWeight) * 100).toFixed(1))
    const ironMetals = Number(((rawIron / totalElemWeight) * 100).toFixed(1))
    const waterVolatiles = Number(((rawVolatiles / totalElemWeight) * 100).toFixed(1))
    const carbonOrganics = Number(
      (100.0 - (silicatesRock + ironMetals + waterVolatiles)).toFixed(1)
    )

    const elemental: ElementalComposition = {
      silicatesRock,
      ironMetals,
      waterVolatiles,
      carbonOrganics,
    }

    // 6. Trend Tracking
    this.recordSample(oxygen, carbonDioxide, methane, waterVapor, carbonOrganics)
    const trends: CompositionTrends = {
      oxygenTrend: this.calcTrend(this.o2History),
      co2Trend: this.calcTrend(this.co2History),
      methaneTrend: this.calcTrend(this.ch4History),
      waterVaporTrend: this.calcTrend(this.h2oHistory),
      organicCarbonTrend: this.calcTrend(this.cOrgHistory),
    }

    // 7. Cycle Phase & Dominant Biochemical Regime
    let cyclePhase: BiogeochemicalState['cyclePhase'] = 'diurnal_peak'
    if (Math.sin(rotationProgress) < -0.3) {
      cyclePhase = 'nocturnal_cooling'
    } else if (Math.abs(Math.sin(seasonalProgress)) > 0.6) {
      cyclePhase = 'seasonal_flux'
    }

    let dominantBiochemicalRegime: BiogeochemicalState['dominantBiochemicalRegime'] =
      'Primordial Anoxic'

    if (disasterCO2Surge > 3.0) {
      dominantBiochemicalRegime = 'Volcanic Greenhouse'
    } else if (perturbations.temperatureDeltaCelsius < -8) {
      dominantBiochemicalRegime = 'Glacial Cryo-Lock'
    } else if (perturbations.atmosphericDust > 0.4) {
      dominantBiochemicalRegime = 'Impact Fallback'
    } else if (oxygen >= 18.0) {
      dominantBiochemicalRegime = 'Equilibrium Biosphere'
    } else if (oxygen >= 4.0 && o2ProductionRate > co2RespirationRate) {
      dominantBiochemicalRegime = 'Great Oxidation Surge'
    } else if (methane >= 4.0) {
      dominantBiochemicalRegime = 'Chemosynthetic Haze'
    }

    return {
      atmospheric,
      elemental,
      trends,
      biosphericFlux: {
        oxygenProductionRate: Number(o2ProductionRate.toFixed(3)),
        carbonFixationRate: Number(carbonFixationRate.toFixed(3)),
        respirationRate: Number(co2RespirationRate.toFixed(3)),
        methanogenesisRate: Number(methanogenesisRate.toFixed(3)),
      },
      cyclePhase,
      dominantBiochemicalRegime,
      redoxSinks: {
        oceanDissolvedIron: Number(this.oceanDissolvedIron.toFixed(2)),
        totalBifDeposited: Number(this.totalBifDeposited.toFixed(2)),
        goeTriggered: this.oceanDissolvedIron <= 5.0,
      },
    }
  }

  private recordSample(
    o2: number,
    co2: number,
    ch4: number,
    h2o: number,
    cOrg: number
  ): void {
    this.o2History.push(o2)
    this.co2History.push(co2)
    this.ch4History.push(ch4)
    this.h2oHistory.push(h2o)
    this.cOrgHistory.push(cOrg)

    if (this.o2History.length > 8) this.o2History.shift()
    if (this.co2History.length > 8) this.co2History.shift()
    if (this.ch4History.length > 8) this.ch4History.shift()
    if (this.h2oHistory.length > 8) this.h2oHistory.shift()
    if (this.cOrgHistory.length > 8) this.cOrgHistory.shift()
  }

  private calcTrend(history: number[]): GasTrend {
    if (history.length < 2) return 'stable'
    const delta = (history[history.length - 1] ?? 0) - (history[0] ?? 0)
    if (delta > 0.08) return 'rising'
    if (delta < -0.08) return 'falling'
    return 'stable'
  }

  exportState(): {
    biogenicOxygen: number
    biogenicCarbonFixed: number
    biogenicMethane: number
    oceanDissolvedIron?: number
    totalBifDeposited?: number
  } {
    return {
      biogenicOxygen: this.biogenicOxygen,
      biogenicCarbonFixed: this.biogenicCarbonFixed,
      biogenicMethane: this.biogenicMethane,
      oceanDissolvedIron: this.oceanDissolvedIron,
      totalBifDeposited: this.totalBifDeposited,
    }
  }

  restoreState(state: {
    biogenicOxygen: number
    biogenicCarbonFixed: number
    biogenicMethane: number
    oceanDissolvedIron?: number
    totalBifDeposited?: number
  }): void {
    this.biogenicOxygen = state.biogenicOxygen ?? 0.0
    this.biogenicCarbonFixed = state.biogenicCarbonFixed ?? 0.0
    this.biogenicMethane = state.biogenicMethane ?? 0.0
    this.oceanDissolvedIron = state.oceanDissolvedIron ?? 100.0
    this.totalBifDeposited = state.totalBifDeposited ?? 0.0
  }
}
