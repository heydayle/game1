import { SeededRNG } from '../../../shared/utils/seeded-rng.js'
import { GENESIS_QUESTIONS } from '../data/genesis-questions.js'
import { generatePlanetName } from './planet-namer.js'
import type {
  AtmosphericComposition,
  ElementalComposition,
  EnvironmentalConditions,
  GenesisChoice,
  InitialResources,
  PlanetConfig,
} from '../types/genesis.js'

export class GenesisEngine {
  /**
   * Evaluates player questionnaire answers into a physical, deterministic PlanetConfig.
   *
   * @param answers Map of Question ID -> Choice ID
   * @param rawSeed Optional user seed or random integer
   */
  static generatePlanet(
    answers: Record<number, string>,
    rawSeed?: number
  ): PlanetConfig {
    // 1. Gather all selected choices
    const selectedChoices: GenesisChoice[] = []
    for (const question of GENESIS_QUESTIONS) {
      const choiceId = answers[question.id]
      const choice = question.choices.find((c) => c.id === choiceId)
      if (choice) {
        selectedChoices.push(choice)
      } else {
        // Fallback to first choice if unanswered
        selectedChoices.push(question.choices[0]!)
      }
    }

    // 2. Compute deterministic seed from answers if not explicitly provided
    const seed =
      rawSeed !== undefined
        ? rawSeed | 0
        : GenesisEngine.hashAnswers(selectedChoices)

    const rng = new SeededRNG(seed)

    // 3. Accumulate parameters from choice modifiers
    let starDistanceAU = 1.0
    let waterAbundance = 0.5
    let tectonicActivity = 0.5
    let atmosphericDensity = 1.0
    let greenhouseBonus = 0.0
    let axialTiltDeg = 23.44
    let rotationPeriodHours = 24.0

    let nitrogenWeight = 78.0
    let oxygenWeight = 1.0
    let carbonDioxideWeight = 3.0
    let methaneWeight = 0.5

    let geothermalEnergy = 50
    let mineralRichness = 50
    let primordialBiomass = 50
    let selectionPressure = 0.5
    let mutationTendency = 1.0

    for (const choice of selectedChoices) {
      const m = choice.modifiers

      if (m.starDistanceOffset !== undefined) starDistanceAU += m.starDistanceOffset
      if (m.waterAbundance !== undefined) waterAbundance = m.waterAbundance
      if (m.tectonicActivity !== undefined) tectonicActivity = m.tectonicActivity
      if (m.atmosphericDensity !== undefined) atmosphericDensity = m.atmosphericDensity
      if (m.greenhouseFactor !== undefined) greenhouseBonus += m.greenhouseFactor
      if (m.axialTiltDeg !== undefined) axialTiltDeg = m.axialTiltDeg
      if (m.rotationPeriodHours !== undefined) rotationPeriodHours = m.rotationPeriodHours

      if (m.nitrogenBias !== undefined) nitrogenWeight *= m.nitrogenBias
      if (m.oxygenBias !== undefined) oxygenWeight += m.oxygenBias * 15.0
      if (m.carbonDioxideBias !== undefined) carbonDioxideWeight += m.carbonDioxideBias * 20.0
      if (m.methaneBias !== undefined) methaneWeight += m.methaneBias * 12.0

      if (m.geothermalEnergy !== undefined) geothermalEnergy = (geothermalEnergy + m.geothermalEnergy) / 2
      if (m.mineralRichness !== undefined) mineralRichness = (mineralRichness + m.mineralRichness) / 2
      if (m.primordialBiomass !== undefined) primordialBiomass = (primordialBiomass + m.primordialBiomass) / 2
      if (m.selectionPressure !== undefined) selectionPressure = (selectionPressure + m.selectionPressure) / 2
      if (m.mutationTendency !== undefined) mutationTendency = (mutationTendency + m.mutationTendency) / 2
    }

    // Add subtle deterministic perturbation (±2%)
    const perturb = (val: number, spread = 0.03) =>
      val * (1.0 + rng.nextFloat(-spread, spread))

    starDistanceAU = Math.max(0.72, Math.min(1.75, perturb(starDistanceAU)))
    waterAbundance = Math.max(0.18, Math.min(0.85, perturb(waterAbundance)))
    axialTiltDeg = Math.max(0.0, Math.min(45.0, perturb(axialTiltDeg)))
    rotationPeriodHours = Math.max(8.0, Math.min(60.0, perturb(rotationPeriodHours)))

    // 4. Calculate Solar Flux and Equilibrium Surface Temperature
    // Earth solar constant S0 = 1361 W/m^2
    const solarIrradianceWatts = Math.round(1361 / (starDistanceAU * starDistanceAU))

    // Estimate planetary albedo
    const estimatedAlbedo = 0.1 * waterAbundance + 0.3 * (1 - waterAbundance) + 0.05
    const sigma = 5.670374e-8
    const Teq = Math.pow((solarIrradianceWatts * (1.0 - estimatedAlbedo)) / (4.0 * sigma), 0.25)

    // Greenhouse warming in Kelvin
    const co2Ratio = carbonDioxideWeight / (nitrogenWeight + carbonDioxideWeight + oxygenWeight + methaneWeight)
    const ch4Ratio = methaneWeight / (nitrogenWeight + carbonDioxideWeight + oxygenWeight + methaneWeight)
    const greenhouseKelvin =
      33.0 * Math.pow(atmosphericDensity, 0.3) * (1.0 + 3.0 * co2Ratio + 8.0 * ch4Ratio + greenhouseBonus)

    const surfaceTemperatureKelvin = Math.round(
      Math.max(205, Math.min(355, Teq + greenhouseKelvin))
    )
    const surfaceTemperatureCelsius = Math.round(surfaceTemperatureKelvin - 273.15)

    // 5. Polar Ice Cap Latitude for 3D Shader (0.0 = equator, 1.0 = pole)
    let iceCapLatitude = 0.74
    if (surfaceTemperatureCelsius < -20) {
      iceCapLatitude = 0.38 // Snowball planet
    } else if (surfaceTemperatureCelsius < 0) {
      iceCapLatitude = 0.55 // Extensive glacial sheet
    } else if (surfaceTemperatureCelsius <= 22) {
      iceCapLatitude = 0.70 + (surfaceTemperatureCelsius / 22) * 0.1 // Temperate polar caps
    } else if (surfaceTemperatureCelsius <= 40) {
      iceCapLatitude = 0.85 + ((surfaceTemperatureCelsius - 22) / 18) * 0.1 // Receding polar caps
    } else {
      iceCapLatitude = 0.98 // Ice-free hyperthermic world
    }

    // 6. 3D Shader Ocean Level (0.28 to 0.68)
    const oceanLevel = 0.28 + waterAbundance * 0.42

    // 7. Atmospheric Composition (Exact 100.00% normalization)
    const waterVaporWeight = Math.max(0.1, waterAbundance * 3.5 * Math.max(0.2, (surfaceTemperatureCelsius + 20) / 40))
    const nobleGasesWeight = 1.0

    const totalAtmosphericWeight =
      nitrogenWeight + oxygenWeight + carbonDioxideWeight + methaneWeight + waterVaporWeight + nobleGasesWeight

    const nitrogen = Number(((nitrogenWeight / totalAtmosphericWeight) * 100).toFixed(2))
    const oxygen = Number(((oxygenWeight / totalAtmosphericWeight) * 100).toFixed(2))
    const carbonDioxide = Number(((carbonDioxideWeight / totalAtmosphericWeight) * 100).toFixed(2))
    const methane = Number(((methaneWeight / totalAtmosphericWeight) * 100).toFixed(2))
    const waterVapor = Number(((waterVaporWeight / totalAtmosphericWeight) * 100).toFixed(2))
    const nobleGases = Number((100.0 - (nitrogen + oxygen + carbonDioxide + methane + waterVapor)).toFixed(2))

    const atmosphericComposition: AtmosphericComposition = {
      nitrogen,
      oxygen,
      carbonDioxide,
      methane,
      waterVapor,
      nobleGases,
      pressureAtm: Number(atmosphericDensity.toFixed(2)),
    }

    // 8. Elemental Composition (Exact 100.0% normalization)
    const silicatesWeight = 45.0 + rng.nextFloat(-3, 3)
    const ironWeight = 28.0 + mineralRichness * 0.15 + rng.nextFloat(-2, 2)
    const waterVolatilesWeight = 10.0 + waterAbundance * 25.0
    const carbonWeight = 5.0 + primordialBiomass * 0.1

    const totalElementalWeight = silicatesWeight + ironWeight + waterVolatilesWeight + carbonWeight
    const silicatesRock = Number(((silicatesWeight / totalElementalWeight) * 100).toFixed(1))
    const ironMetals = Number(((ironWeight / totalElementalWeight) * 100).toFixed(1))
    const waterVolatiles = Number(((waterVolatilesWeight / totalElementalWeight) * 100).toFixed(1))
    const carbonOrganics = Number((100.0 - (silicatesRock + ironMetals + waterVolatiles)).toFixed(1))

    const elementalComposition: ElementalComposition = {
      silicatesRock,
      ironMetals,
      waterVolatiles,
      carbonOrganics,
    }

    // 9. Initial Resources
    const initialResources: InitialResources = {
      geothermalEnergy: Math.round(geothermalEnergy),
      solarIrradianceWatts,
      mineralRichness: Math.round(mineralRichness),
      primordialBiomass: Math.round(primordialBiomass),
    }

    // 10. Environmental Conditions
    let radiationLevel: EnvironmentalConditions['radiationLevel'] = 'moderate'
    if (starDistanceAU < 0.75 && atmosphericDensity < 0.9) {
      radiationLevel = 'extreme'
    } else if (starDistanceAU < 0.85) {
      radiationLevel = 'intense'
    } else if (starDistanceAU > 1.4) {
      radiationLevel = 'shielded'
    }

    let tectonicStability: EnvironmentalConditions['tectonicStability'] = 'stable'
    if (tectonicActivity > 0.75) tectonicStability = 'cataclysmic'
    else if (tectonicActivity > 0.45) tectonicStability = 'active'
    else if (tectonicActivity < 0.25) tectonicStability = 'dormant'

    const environmentalConditions: EnvironmentalConditions = {
      radiationLevel,
      tectonicStability,
      selectionPressure: Number(selectionPressure.toFixed(2)),
      mutationRateMultiplier: Number(mutationTendency.toFixed(2)),
    }

    // 11. Atmosphere Hue
    let atmosphereColor = '#38bdf8' // Default oxygen-nitrogen blue
    if (atmosphericComposition.carbonDioxide > 8.0) {
      atmosphereColor = '#f59e0b' // Amber greenhouse
    } else if (atmosphericComposition.methane > 4.0) {
      atmosphereColor = '#14b8a6' // Primordial teal-emerald
    } else if (atmosphericDensity < 0.6) {
      atmosphereColor = '#818cf8' // Thin indigo
    }

    // 12. Procedural Name
    const name = generatePlanetName(surfaceTemperatureCelsius, waterAbundance, seed)

    return {
      name,
      seed,
      starDistanceAU: Number(starDistanceAU.toFixed(2)),
      surfaceTemperatureKelvin,
      surfaceTemperatureCelsius,
      axialTiltDeg: Number(axialTiltDeg.toFixed(2)),
      rotationPeriodHours: Number(rotationPeriodHours.toFixed(1)),
      oceanLevel: Number(oceanLevel.toFixed(3)),
      iceCapLatitude: Number(iceCapLatitude.toFixed(3)),
      atmosphereColor,
      atmosphericComposition,
      elementalComposition,
      initialResources,
      environmentalConditions,
    }
  }

  /**
   * Hashes player choices into a deterministic positive 32-bit unsigned integer.
   */
  private static hashAnswers(choices: readonly GenesisChoice[]): number {
    let hash = 2166136261
    for (const choice of choices) {
      for (let i = 0; i < choice.id.length; i++) {
        hash ^= choice.id.charCodeAt(i)
        hash = Math.imul(hash, 16777619)
      }
    }
    return (hash >>> 0)
  }
}

