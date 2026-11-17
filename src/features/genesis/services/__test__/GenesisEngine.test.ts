import { describe, it, expect } from 'vitest'
import { GenesisEngine } from '../GenesisEngine.js'

describe('GenesisEngine', () => {
  const earthLikeAnswers: Record<number, string> = {
    1: 'q1_magnetic',
    2: 'q2_meridian',
    3: 'q3_balanced',
    4: 'q4_shield',
    5: 'q5_earth',
    6: 'q6_solar',
    7: 'q7_carbonaceous',
    8: 'q8_pools',
    9: 'q9_dynamic',
    10: 'q10_resilience',
  }

  const oceanWorldAnswers: Record<number, string> = {
    1: 'q1_crystalline',
    2: 'q2_inner',
    3: 'q3_thalassic',
    4: 'q4_shield',
    5: 'q5_upright',
    6: 'q6_swift',
    7: 'q7_silica',
    8: 'q8_vents',
    9: 'q9_sanctuary',
    10: 'q10_symbiosis',
  }

  const frigidAridAnswers: Record<number, string> = {
    1: 'q1_geothermal',
    2: 'q2_outer',
    3: 'q3_arid',
    4: 'q4_greenhouse',
    5: 'q5_extreme',
    6: 'q6_languid',
    7: 'q7_metalliferous',
    8: 'q8_meteor',
    9: 'q9_spartan',
    10: 'q10_mutation',
  }

  describe('deterministic reproducibility', () => {
    it('produces identical output for identical answers and seed', () => {
      const config1 = GenesisEngine.generatePlanet(earthLikeAnswers, 12345)
      const config2 = GenesisEngine.generatePlanet(earthLikeAnswers, 12345)

      expect(config1).toEqual(config2)
    })

    it('produces identical output when seed is omitted (deterministic hash)', () => {
      const config1 = GenesisEngine.generatePlanet(earthLikeAnswers)
      const config2 = GenesisEngine.generatePlanet(earthLikeAnswers)

      expect(config1.seed).toBe(config2.seed)
      expect(config1.name).toBe(config2.name)
      expect(config1.surfaceTemperatureCelsius).toBe(config2.surfaceTemperatureCelsius)
    })

    it('produces different planets for different answer choices', () => {
      const earthLike = GenesisEngine.generatePlanet(earthLikeAnswers, 42)
      const oceanWorld = GenesisEngine.generatePlanet(oceanWorldAnswers, 42)

      expect(earthLike.oceanLevel).not.toBe(oceanWorld.oceanLevel)
      expect(oceanWorld.oceanLevel).toBeGreaterThan(earthLike.oceanLevel)
    })
  })

  describe('physical constraints & conservation', () => {
    it('atmospheric composition percentages sum to approximately 100%', () => {
      const config = GenesisEngine.generatePlanet(earthLikeAnswers, 999)
      const atm = config.atmosphericComposition

      const totalAtm =
        atm.nitrogen +
        atm.oxygen +
        atm.carbonDioxide +
        atm.methane +
        atm.waterVapor +
        atm.nobleGases

      expect(totalAtm).toBeGreaterThanOrEqual(99.5)
      expect(totalAtm).toBeLessThanOrEqual(100.5)
    })

    it('elemental composition percentages sum to approximately 100%', () => {
      const config = GenesisEngine.generatePlanet(earthLikeAnswers, 888)
      const elem = config.elementalComposition

      const totalElem =
        elem.silicatesRock +
        elem.ironMetals +
        elem.waterVolatiles +
        elem.carbonOrganics

      expect(totalElem).toBeGreaterThanOrEqual(99.5)
      expect(totalElem).toBeLessThanOrEqual(100.5)
    })

    it('enforces physically sound star distance and solar flux', () => {
      const config = GenesisEngine.generatePlanet(frigidAridAnswers, 100)
      expect(config.starDistanceAU).toBeGreaterThanOrEqual(0.7)
      expect(config.starDistanceAU).toBeLessThanOrEqual(1.8)
      expect(config.initialResources.solarIrradianceWatts).toBeGreaterThan(0)
    })

    it('computes realistic surface temperatures', () => {
      const warmPlanet = GenesisEngine.generatePlanet(oceanWorldAnswers, 200)
      const coldPlanet = GenesisEngine.generatePlanet(frigidAridAnswers, 200)

      expect(warmPlanet.surfaceTemperatureKelvin).toBeGreaterThan(
        coldPlanet.surfaceTemperatureKelvin
      )
      expect(warmPlanet.surfaceTemperatureKelvin).toBeGreaterThan(200)
      expect(warmPlanet.surfaceTemperatureKelvin).toBeLessThan(360)
    })

    it('adjusts ice caps based on temperature', () => {
      const coldPlanet = GenesisEngine.generatePlanet(frigidAridAnswers, 300)
      const warmPlanet = GenesisEngine.generatePlanet(oceanWorldAnswers, 300)

      // Cold world should have ice cap extending further towards equator (lower threshold)
      expect(coldPlanet.iceCapLatitude).toBeLessThan(warmPlanet.iceCapLatitude)
    })

    it('keeps shader ocean level within valid geometric limits', () => {
      const config = GenesisEngine.generatePlanet(earthLikeAnswers, 777)
      expect(config.oceanLevel).toBeGreaterThanOrEqual(0.25)
      expect(config.oceanLevel).toBeLessThanOrEqual(0.75)
    })
  })
})

