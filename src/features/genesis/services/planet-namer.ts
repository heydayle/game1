import { SeededRNG } from '../../../shared/utils/seeded-rng.js'

const THALASSIC_PREFIXES = ['Thalassa', 'Pelagia', 'Oceanus', 'Nereis', 'Tethys', 'Sirena', 'Aegaea', 'Pontus']
const VOLCANIC_PREFIXES = ['Ignis', 'Vulcan', 'Pyros', 'Tartarus', 'Muspel', 'Hephaestus', 'Surtur', 'Magma']
const GLACIAL_PREFIXES = ['Cryos', 'Boreas', 'Hyperion', 'Niflheim', 'Frosthaven', 'Glacies', 'Caelum', 'Ymir']
const VERDANT_PREFIXES = ['Aethel', 'Gaia', 'Silvanus', 'Verdantia', 'Chloris', 'Elysium', 'Arcadia', 'Flora']
const DESERT_PREFIXES = ['Kalyx', 'Dune', 'Sahara', 'Xerion', 'Barathrum', 'Solaria', 'Arrakis', 'Sirocco']
const BALANCED_PREFIXES = ['Novum', 'Meridian', 'Chronos', 'Astraea', 'Harmonia', 'Genesis', 'Orion', 'Tellus']

const SUFFIXES = [
  'Prime',
  'Major',
  'Beta',
  'IV',
  'VII',
  'IX',
  'Cygni',
  'Eridani',
  'Secundus',
  'Meridian',
  'Centauri',
  'Australis',
]

export function generatePlanetName(
  tempCelsius: number,
  waterCoverage: number,
  seed: number
): string {
  const rng = new SeededRNG(seed + 9999)

  let prefixPool = BALANCED_PREFIXES
  if (waterCoverage > 0.6) {
    prefixPool = THALASSIC_PREFIXES
  } else if (tempCelsius < -10) {
    prefixPool = GLACIAL_PREFIXES
  } else if (tempCelsius > 35 && waterCoverage < 0.4) {
    prefixPool = VOLCANIC_PREFIXES
  } else if (waterCoverage < 0.3) {
    prefixPool = DESERT_PREFIXES
  } else if (tempCelsius >= 5 && tempCelsius <= 32 && waterCoverage >= 0.4) {
    prefixPool = VERDANT_PREFIXES
  }

  const prefixIndex = rng.nextInt(0, prefixPool.length - 1)
  const suffixIndex = rng.nextInt(0, SUFFIXES.length - 1)

  const prefix = prefixPool[prefixIndex] ?? 'Genesis'
  const suffix = SUFFIXES[suffixIndex] ?? 'Prime'

  return `${prefix} ${suffix}`
}
