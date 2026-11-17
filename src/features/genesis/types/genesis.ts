/**
 * Domain types for the Genesis System.
 *
 * Defines the question schema, answers, and the resulting PlanetConfig contract.
 */

export interface GenesisChoiceModifiers {
  readonly starDistanceOffset?: number // AU offset (-0.3 to +0.5)
  readonly waterAbundance?: number // 0.0 (arid) to 1.0 (waterworld)
  readonly tectonicActivity?: number // 0.0 (dead) to 1.0 (super-volcanic)
  readonly atmosphericDensity?: number // atm (0.2 to 3.0)
  readonly greenhouseFactor?: number // 0.0 to 1.0
  readonly axialTiltDeg?: number // degrees (0 to 45)
  readonly rotationPeriodHours?: number // hours (8 to 60)
  readonly oxygenBias?: number // relative weight
  readonly carbonDioxideBias?: number // relative weight
  readonly nitrogenBias?: number // relative weight
  readonly methaneBias?: number // relative weight
  readonly geothermalEnergy?: number // 0 to 100
  readonly mineralRichness?: number // 0 to 100
  readonly primordialBiomass?: number // 0 to 100
  readonly selectionPressure?: number // 0.0 to 1.0
  readonly mutationTendency?: number // 0.5 to 2.5
}

export interface GenesisChoice {
  readonly id: string
  readonly title: string
  readonly subtitle: string
  readonly description: string
  readonly modifiers: GenesisChoiceModifiers
}

export interface GenesisQuestion {
  readonly id: number
  readonly title: string
  readonly category: string
  readonly prompt: string
  readonly choices: readonly GenesisChoice[]
}

export interface AtmosphericComposition {
  readonly nitrogen: number // %
  readonly oxygen: number // %
  readonly carbonDioxide: number // %
  readonly waterVapor: number // %
  readonly methane: number // %
  readonly nobleGases: number // %
  readonly pressureAtm: number // atmospheres
}

export interface ElementalComposition {
  readonly silicatesRock: number // %
  readonly ironMetals: number // %
  readonly waterVolatiles: number // %
  readonly carbonOrganics: number // %
}

export interface InitialResources {
  readonly geothermalEnergy: number // 0 - 100 index
  readonly solarIrradianceWatts: number // W/m^2
  readonly mineralRichness: number // 0 - 100 index
  readonly primordialBiomass: number // 0 - 100 index
}

export interface EnvironmentalConditions {
  readonly radiationLevel: 'shielded' | 'moderate' | 'intense' | 'extreme'
  readonly tectonicStability: 'dormant' | 'stable' | 'active' | 'cataclysmic'
  readonly selectionPressure: number // 0.0 to 1.0
  readonly mutationRateMultiplier: number // multiplier
}

export interface PlanetConfig {
  readonly name: string
  readonly seed: number
  readonly starDistanceAU: number // 0.7 to 1.8 AU
  readonly surfaceTemperatureKelvin: number
  readonly surfaceTemperatureCelsius: number
  readonly axialTiltDeg: number
  readonly rotationPeriodHours: number
  readonly oceanLevel: number // 0.25 to 0.75 (3D shader input)
  readonly iceCapLatitude: number // 0.40 to 0.95 (3D shader input)
  readonly atmosphereColor: string // hex color
  readonly atmosphericComposition: AtmosphericComposition
  readonly elementalComposition: ElementalComposition
  readonly initialResources: InitialResources
  readonly environmentalConditions: EnvironmentalConditions
}

