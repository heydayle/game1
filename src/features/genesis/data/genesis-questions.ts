import type { GenesisQuestion } from '../types/genesis.js'

export const GENESIS_QUESTIONS: readonly GenesisQuestion[] = [
  {
    id: 1,
    title: 'The Primordial Spark',
    category: 'Planetary Core',
    prompt: 'Before the crust hardened, what primordial energy catalyzed the birth of your world?',
    choices: [
      {
        id: 'q1_geothermal',
        title: 'Volcanic Crucible',
        subtitle: 'Fierce internal dynamo and molten mantle',
        description: 'Endows the planet with massive geothermal currents, high tectonics, and rich volcanic mineral vents.',
        modifiers: {
          geothermalEnergy: 85,
          tectonicActivity: 0.8,
          mineralRichness: 75,
        },
      },
      {
        id: 'q1_crystalline',
        title: 'Crystalline Equilibrium',
        subtitle: 'Stable silicates and serene cooling',
        description: 'Produces a seismically quiet crust with vast continental shields and low tectonic disturbance.',
        modifiers: {
          geothermalEnergy: 35,
          tectonicActivity: 0.2,
          mineralRichness: 50,
        },
      },
      {
        id: 'q1_magnetic',
        title: 'Deep Iron Dynamo',
        subtitle: 'Superdense molten core generating a colossal magnetosphere',
        description: 'Provides intense shielding against cosmic radiation and retains a dense, stable atmosphere.',
        modifiers: {
          geothermalEnergy: 60,
          tectonicActivity: 0.5,
          mineralRichness: 90,
          atmosphericDensity: 1.25,
        },
      },
    ],
  },
  {
    id: 2,
    title: 'Stellar Sanctuary',
    category: 'Orbital Distance',
    prompt: 'Where shall your world orbit relative to its luminous parent star?',
    choices: [
      {
        id: 'q2_inner',
        title: 'The Radiant Hearth (0.85 AU)',
        subtitle: 'Close inner orbit bathed in intense stellar flux',
        description: 'Blistering solar irradiance, accelerated energetic photochemical cycles, and warm tropical seas.',
        modifiers: {
          starDistanceOffset: -0.15,
          greenhouseFactor: 0.15,
        },
      },
      {
        id: 'q2_meridian',
        title: 'The Temperate Meridian (1.00 AU)',
        subtitle: 'The golden balance of warmth and liquid water',
        description: 'Moderate stellar irradiance sustaining stable hydrologic cycles and temperate biomes.',
        modifiers: {
          starDistanceOffset: 0.0,
          greenhouseFactor: 0.05,
        },
      },
      {
        id: 'q2_outer',
        title: 'The Frigid Frontier (1.35 AU)',
        subtitle: 'Distant celestial boundary with pale sunlight',
        description: 'Cool planetary temperatures, vast polar ice coverage, and slow, contemplative chemical kinetics.',
        modifiers: {
          starDistanceOffset: 0.35,
          greenhouseFactor: -0.1,
        },
      },
    ],
  },
  {
    id: 3,
    title: 'The Hydrosphere',
    category: 'Water Distribution',
    prompt: 'What volume of primordial oceans shall flood the continental basins?',
    choices: [
      {
        id: 'q3_thalassic',
        title: 'Pelagic Oceanworld',
        subtitle: '78% water coverage with isolated island archipelagos',
        description: 'Expansive warm oceans, moderate planetary thermal inertia, and vibrant neritic marine biomes.',
        modifiers: {
          waterAbundance: 0.75,
          nitrogenBias: 1.0,
        },
      },
      {
        id: 'q3_balanced',
        title: 'Dual Continents & Seas',
        subtitle: '50% balanced sea-to-land ratio',
        description: 'Extensive coastlines, dynamic continental river systems, and diverse transitional biomes.',
        modifiers: {
          waterAbundance: 0.50,
          nitrogenBias: 1.1,
        },
      },
      {
        id: 'q3_arid',
        title: 'Terran Oasis Basin',
        subtitle: '28% water coverage among sprawling arid plateaus',
        description: 'Large contiguous continents, inland salt seas, intense desert climates, and sparse water reservoirs.',
        modifiers: {
          waterAbundance: 0.28,
          nitrogenBias: 0.9,
        },
      },
    ],
  },
  {
    id: 4,
    title: 'The Breath of the World',
    category: 'Atmosphere',
    prompt: 'What molecular blanket envelops and shields the surface?',
    choices: [
      {
        id: 'q4_shield',
        title: 'Nitrogen-Shielded Azure Canopy',
        subtitle: 'Crisp, transparent atmosphere rich in inert nitrogen',
        description: 'Stable pressure (1.0 atm), clear planetary horizons, and gentle meteorological patterns.',
        modifiers: {
          atmosphericDensity: 1.0,
          nitrogenBias: 1.5,
          oxygenBias: 0.3,
          carbonDioxideBias: 0.05,
        },
      },
      {
        id: 'q4_greenhouse',
        title: 'Carbonaceous Greenhouse Haze',
        subtitle: 'Dense blanket insulating the world with thermal trapped heat',
        description: 'High barometric pressure (1.8 atm), amber twilight skies, and uniform global temperatures.',
        modifiers: {
          atmosphericDensity: 1.8,
          carbonDioxideBias: 0.45,
          greenhouseFactor: 0.35,
          methaneBias: 0.1,
        },
      },
      {
        id: 'q4_reducing',
        title: 'Primordial Methane Mist',
        subtitle: 'Chemically reducing Archaean atmosphere rich in organics',
        description: 'Exotic cyan-emerald skies, rapid prebiotic amino synthesis, and strong ultraviolet filtering.',
        modifiers: {
          atmosphericDensity: 1.4,
          methaneBias: 0.4,
          nitrogenBias: 1.1,
          greenhouseFactor: 0.25,
        },
      },
    ],
  },
  {
    id: 5,
    title: 'The Dance of Seasons',
    category: 'Axial Tilt',
    prompt: 'How steeply does your planet incline toward its orbital plane?',
    choices: [
      {
        id: 'q5_upright',
        title: 'The Perpendicular Axis (4° Tilt)',
        subtitle: 'Eternal unvarying seasons and static climate zones',
        description: 'Borders between equatorial jungles and polar frost remain perpetual and unchanging across centuries.',
        modifiers: {
          axialTiltDeg: 4.0,
        },
      },
      {
        id: 'q5_earth',
        title: 'The Harmonic Slant (23.5° Tilt)',
        subtitle: 'Predictable rhythmic turnover of seasons',
        description: 'Regular seasonal migrations, spring thaws, and autumnal harvests governing biological life cycles.',
        modifiers: {
          axialTiltDeg: 23.44,
        },
      },
      {
        id: 'q5_extreme',
        title: 'The Wild Incline (38° Tilt)',
        subtitle: 'Violent seasonal swings between blistering summers and frozen dark winters',
        description: 'Demands extreme biological resilience and dormancy strategies to survive colossal weather oscillations.',
        modifiers: {
          axialTiltDeg: 38.0,
          selectionPressure: 0.25,
        },
      },
    ],
  },
  {
    id: 6,
    title: 'Diurnal Rhythm',
    category: 'Rotation Period',
    prompt: 'With what cadence does the planet spin from twilight to twilight?',
    choices: [
      {
        id: 'q6_swift',
        title: 'The Whirling Meridian (14-Hour Day)',
        subtitle: 'Rapid day/night alternation with fierce Coriolis winds',
        description: 'Rapid thermal changes, strong zonal atmospheric jet streams, and short nocturnal periods.',
        modifiers: {
          rotationPeriodHours: 14.0,
        },
      },
      {
        id: 'q6_solar',
        title: 'The Sol Standard (24-Hour Day)',
        subtitle: 'Balanced circadian rhythm of sunlight and rest',
        description: 'Optimal day-night duration allowing sustained diurnal and nocturnal ecological niches.',
        modifiers: {
          rotationPeriodHours: 24.0,
        },
      },
      {
        id: 'q6_languid',
        title: 'The Languid Epoch (48-Hour Day)',
        subtitle: 'Long, deep baking sunlit epochs followed by prolonged freezing nights',
        description: 'Significant diurnal temperature swings driving specialized thermal burrowing or heat-storing adaptations.',
        modifiers: {
          rotationPeriodHours: 48.0,
          selectionPressure: 0.15,
        },
      },
    ],
  },
  {
    id: 7,
    title: 'The Mineral Skeleton',
    category: 'Lithosphere',
    prompt: 'What elemental treasures dominate the planetary crust and bedrock?',
    choices: [
      {
        id: 'q7_metalliferous',
        title: 'Heavy Metal & Chalcophile Basalt',
        subtitle: 'Dense iron-nickel deposits and mineral catalyst veins',
        description: 'Catalyzes inorganic enzyme precursors and metallic cellular cofactors across lifeforms.',
        modifiers: {
          mineralRichness: 85,
          tectonicActivity: 0.6,
        },
      },
      {
        id: 'q7_carbonaceous',
        title: 'Carbonaceous Clay & Shales',
        subtitle: 'Rich organic sedimentary beds holding carbon, nitrogen, and phosphorus',
        description: 'Abundant building blocks for nucleic acids, amino sequences, and swift biomass proliferation.',
        modifiers: {
          primordialBiomass: 80,
          mineralRichness: 55,
        },
      },
      {
        id: 'q7_silica',
        title: 'Silicate Granite & Quartz Highlands',
        subtitle: 'High-standing continental granite cratons resistant to erosion',
        description: 'Towering continental relief, crystal-clear runoffs, and stable crystalline soil strata.',
        modifiers: {
          mineralRichness: 60,
          geothermalEnergy: 40,
        },
      },
    ],
  },
  {
    id: 8,
    title: 'The Cradle of Genesis',
    category: 'Biogenesis Zone',
    prompt: 'In which sanctum shall the first self-replicating molecular polymers assemble?',
    choices: [
      {
        id: 'q8_vents',
        title: 'Hydrothermal Ocean Vents',
        subtitle: 'Deep volcanic chimneys spewing iron-sulfur minerals',
        description: 'Life thrives independent of sunlight, shielded from surface impacts, driven by chemosynthesis.',
        modifiers: {
          geothermalEnergy: 75,
          primordialBiomass: 65,
          selectionPressure: 0.1,
        },
      },
      {
        id: 'q8_pools',
        title: 'Tidal Coastal Lagoons',
        subtitle: 'Sun-drenched intertidal clays undergoing drying-wetting cycles',
        description: 'Sunlight fuels rapid photochemical polymerization; organisms develop solar absorption pigments.',
        modifiers: {
          primordialBiomass: 75,
          mutationTendency: 1.1,
        },
      },
      {
        id: 'q8_meteor',
        title: 'Exogenous Cometary Sowing',
        subtitle: 'Bombardment by ice-rich comets bearing complex alien organics',
        description: 'Infuses rare chirality molecules and high initial mutation potential from cosmic genesis.',
        modifiers: {
          primordialBiomass: 55,
          mutationTendency: 1.4,
          selectionPressure: 0.2,
        },
      },
    ],
  },
  {
    id: 9,
    title: 'Nature’s Crucible',
    category: 'Environmental Pressure',
    prompt: 'How unforgiving shall the natural selection sieve be on nascent populations?',
    choices: [
      {
        id: 'q9_sanctuary',
        title: 'The Benevolent Cradle',
        subtitle: 'Mild climates, bountiful nutrients, and rare calamities',
        description: 'Fosters explosive morphological diversity and complex symbiotic communal structures with low extinction rates.',
        modifiers: {
          selectionPressure: 0.2,
          mutationTendency: 0.8,
        },
      },
      {
        id: 'q9_dynamic',
        title: 'The Pulsing Crucible',
        subtitle: 'Moderate climate cycles, episodic droughts, and shifting biomes',
        description: 'Forces populations to maintain genetic plasticity and balanced ecological specializations.',
        modifiers: {
          selectionPressure: 0.5,
          mutationTendency: 1.0,
        },
      },
      {
        id: 'q9_spartan',
        title: 'The Spartan Gauntlet',
        subtitle: 'Fierce competitive attrition, frequent storms, and severe resource caps',
        description: 'Only the leanest, most energy-efficient, and relentlessly adaptable genotypes survive extinction.',
        modifiers: {
          selectionPressure: 0.85,
          mutationTendency: 1.35,
        },
      },
    ],
  },
  {
    id: 10,
    title: 'The Evolutionary Horizon',
    category: 'Genetic Destiny',
    prompt: 'What overarching instinct shall be etched into the primeval code of life?',
    choices: [
      {
        id: 'q10_resilience',
        title: 'Steadfast Fidelity',
        subtitle: 'High-precision genetic replication and cellular endurance',
        description: 'Low mutation rates preserve proven beneficial traits and build robust, long-lived lineage bastions.',
        modifiers: {
          mutationTendency: 0.7,
        },
      },
      {
        id: 'q10_mutation',
        title: 'Hyper-Adaptive Speciation',
        subtitle: 'Permissive genomic recombination and restless diversification',
        description: 'High mutation rates fuel rapid phenotypic divergence and rapid occupation of vacant ecological niches.',
        modifiers: {
          mutationTendency: 1.6,
        },
      },
      {
        id: 'q10_symbiosis',
        title: 'Communal Interconnection',
        subtitle: 'Cooperative biomes, nutrient pooling, and symbiotic synthesis',
        description: 'Species co-evolve tight trophic networks that transform barren rock into self-sustaining biosphere canopies.',
        modifiers: {
          primordialBiomass: 85,
          mutationTendency: 1.1,
        },
      },
    ],
  },
]

