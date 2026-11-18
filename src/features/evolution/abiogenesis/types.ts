/**
 * Domain types for Prebiotic Chemistry, Primordial Soup, Protocells, and Abiogenesis.
 * Models the three grand evolutionary eras:
 * 1. Chemical Evolution (Tiến hóa Hóa học): Vô cơ -> Hợp chất hữu cơ & Monomer
 * 2. Prebiological Evolution (Tiến hóa Tiền sinh học): Hình thành Nguyên bào & Tế bào sơ khai (Protocells / Coacervates)
 * 3. Biological Evolution (Tiến hóa Sinh học): Tế bào sống thực thụ với di truyền ổn định, rẽ nhánh tự do phi Trái Đất
 */

export type LifeStage = 'prebiotic' | 'inhabited' | 'extinct'

/**
 * Three grand evolutionary macro-eras of the planet.
 */
export type MacroEvolutionEra =
  | 'chemical_evolution' // Kỷ I: Tiến hóa Hóa học (Tổng hợp Monomer & Hợp chất vô cơ/hữu cơ)
  | 'prebiological_evolution' // Kỷ II: Tiến hóa Tiền sinh học (Tạo Nguyên bào / Tế bào sơ khai - Protocells)
  | 'biological_evolution' // Kỷ III: Tiến hóa Sinh học (Sinh quyển đa dạng rẽ nhánh tự do)

/**
 * Planetary Protocell / Probiont Architectural Morphology:
 * Adapts to planetary temperature, solvent, and elemental makeup (not bound to Earth lipid vesicles).
 */
export type ProtocellForm =
  | 'lipid_coacervate' // Nguyên bào Màng Lipid Coacervate (Hành tinh dung môi nước ôn đới)
  | 'silico_vesicle' // Nguyên bào Bọc Tinh thể Silic Áp điện (Hành tinh silicat, nhiệt cao/bức xạ)
  | 'azotosome_cryo' // Nguyên bào Azotosome Mê-tan Siêu hàn (Hành tinh băng giá âm độ, hồ hydrocacbon)
  | 'iron_sulfur_bubble' // Nguyên bào Bọt Sắt-Lưu huỳnh Thủy nhiệt (Hành tinh miệng phun vực thẳm anoxic)
  | 'aerosol_droplet' // Nguyên bào Giọt Sương Khí quyển Đối lưu (Hành tinh khí quyển dày, trọng lực nhẹ)

/**
 * Five continuous phases of chemical evolution.
 * Occurs in parallel throughout the planetary lifecycle:
 * - Prebiotic dawn: monomer -> polymer -> protocell -> microbial emergence
 * - Inhabited era: continuous biogeochemical organic flux, co-evolving alongside biological organisms
 * - Extinction: post-extinction recycling and resurgence
 */
export type ChemicalEvolutionPhase =
  | 'monomer_synthesis' // Nấc I: Tổng hợp Monomer vô cơ (Axit amin, nucleobase)
  | 'polymer_formation' // Nấc II: Hình thành Polyme & Chuỗi RNA nguyên thủy
  | 'protocell_assembly' // Nấc III: Lắp ráp Màng lipid & Giọt Coacervate tiền tế bào
  | 'microbial_emergence' // Nấc IV: Khởi sinh Vi sinh vật Sơ khai (Biogenesis)
  | 'biogeochemical_flux' // Nấc V: Tuần hoàn Hóa sinh quyển Đồng Tiến hóa (Living Era Flux)

export type ChemicalCatalystType = 'spark' | 'vent'

export interface PrebioticState {
  /** Current planetary life stage */
  readonly stage: LifeStage
  /** The overarching grand evolutionary macro era */
  readonly macroEra: MacroEvolutionEra
  /** Localized label for the grand era */
  readonly macroEraLabel: string
  /** The environmental protocell / probiont archetype emerging from the planet's chemistry */
  readonly protocellForm: ProtocellForm
  /** Human-readable description of the protocell archetype */
  readonly protocellFormLabel: string
  /** Protocell maturation and structural integrity [0, 1] */
  readonly protocellComplexity: number
  /** Primitive proto-metabolic reaction rate inside protocells [0, 1] */
  readonly protoMetabolismRate: number

  /** Overall chemical fertility index of the planet [0, 1] */
  readonly chemicalFertility: number
  /** Organic chemical complexity progress toward spontaneous abiogenesis [0, 1] */
  readonly organicComplexity: number
  /** Liquid water solvent viability score [0, 1] */
  readonly waterViability: number
  /** Organic building block availability (carbon & nitrogen compounds) [0, 1] */
  readonly organicAbundance: number
  /** Catalytic energy flux (geothermal, solar UV, mineral catalysts) [0, 1] */
  readonly catalystEnergy: number
  /** Whether the primordial soup meets minimum threshold to spark biogenesis */
  readonly biogenesisReadiness: boolean
  /** Progenitor archetypal lineage name derived from chemical composition */
  readonly chemicalLineageArchetype: string
  /** Human-readable status description of the prebiotic soup */
  readonly statusDescription: string

  // ---- Continuous Parallel Chemical Evolution Fields ----
  /** Current active chemical evolution phase */
  readonly chemicalPhase: ChemicalEvolutionPhase
  /** Localized human-readable label for the chemical phase */
  readonly chemicalPhaseLabel: string
  /** Concentration of monomer building blocks (amino acids, nucleobases, ribose) [0, 1] */
  readonly monomerConcentration: number
  /** Macromolecular complexity (peptides, catalytic RNA polymers) [0, 1] */
  readonly polymerComplexity: number
  /** Membrane formation and protocell/vesicle stability [0, 1] */
  readonly protocellStability: number
  /** Global primordial organic reservoir volume [0, 1] */
  readonly organicPoolVolume: number
  /** Recycling flux rate fed back into the chemical pool by living biomass/death [0, 1] */
  readonly bioticFeedbackFlux: number
  /** Whether the chemical soup is super-saturated and ready for de novo microbial synthesis */
  readonly deNovoSynthesisReady: boolean
  /** Last active chemical catalyst applied ('spark' | 'vent' | null) */
  readonly lastCatalystApplied?: ChemicalCatalystType | null
}


