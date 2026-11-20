import type {
  AtmosphericComposition,
  ElementalComposition,
} from '../../genesis/types/genesis.js'

export type GasTrend = 'rising' | 'falling' | 'stable'

export interface CompositionTrends {
  readonly oxygenTrend: GasTrend
  readonly co2Trend: GasTrend
  readonly methaneTrend: GasTrend
  readonly waterVaporTrend: GasTrend
  readonly organicCarbonTrend: GasTrend
}

export interface BiogeochemicalState {
  readonly atmospheric: AtmosphericComposition
  readonly elemental: ElementalComposition
  readonly trends: CompositionTrends
  readonly biosphericFlux: {
    readonly oxygenProductionRate: number // % per rotation
    readonly carbonFixationRate: number // % per rotation
    readonly respirationRate: number // % per rotation
    readonly methanogenesisRate: number // % per rotation
  }
  readonly cyclePhase: 'diurnal_peak' | 'nocturnal_cooling' | 'seasonal_flux'
  readonly dominantBiochemicalRegime:
    | 'Primordial Anoxic'
    | 'Chemosynthetic Haze'
    | 'Great Oxidation Surge'
    | 'Equilibrium Biosphere'
    | 'Volcanic Greenhouse'
    | 'Glacial Cryo-Lock'
    | 'Impact Fallback'
  readonly redoxSinks?: {
    readonly oceanDissolvedIron: number // [0, 100]%
    readonly totalBifDeposited: number
    readonly goeTriggered: boolean
  }
}

export const DEFAULT_BIOGEOCHEMICAL_STATE: BiogeochemicalState = {
  atmospheric: {
    nitrogen: 78.08,
    oxygen: 0.1,
    carbonDioxide: 12.5,
    waterVapor: 1.2,
    methane: 4.5,
    nobleGases: 3.62,
    pressureAtm: 1.0,
  },
  elemental: {
    silicatesRock: 48.2,
    ironMetals: 31.5,
    waterVolatiles: 14.8,
    carbonOrganics: 5.5,
  },
  trends: {
    oxygenTrend: 'stable',
    co2Trend: 'stable',
    methaneTrend: 'stable',
    waterVaporTrend: 'stable',
    organicCarbonTrend: 'stable',
  },
  biosphericFlux: {
    oxygenProductionRate: 0.0,
    carbonFixationRate: 0.0,
    respirationRate: 0.0,
    methanogenesisRate: 0.0,
  },
  cyclePhase: 'diurnal_peak',
  dominantBiochemicalRegime: 'Primordial Anoxic',
  redoxSinks: {
    oceanDissolvedIron: 100.0,
    totalBifDeposited: 0.0,
    goeTriggered: false,
  },
}
