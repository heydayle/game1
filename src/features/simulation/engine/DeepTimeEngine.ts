/**
 * DeepTimeEngine — Astronomical & Geological Deep Time Model
 *
 * Decouples physical planetary rotations (diurnal cycles) from deep geological
 * time (eons, eras, mega-years, and giga-years).
 *
 * Physical conversions:
 * - 1 Planetary Rotation = 1 Astronomical Day (~24h default)
 * - 1 Orbital Year = daysPerYear rotations (~365.25 days)
 * - 1 Mega-annum (Ma) = 1,000,000 years
 * - 1 Giga-annum (Ga) = 1,000,000,000 years
 *
 * Geological Eons:
 * 1. Hadean (Hỏa Minh): Formation to 4.0 Ga ago (Elapsed 0 - 600 Ma). Prebiotic crust cooling.
 * 2. Archean (Thái Cổ): 4.0 Ga to 2.5 Ga ago (Elapsed 600 - 2100 Ma). Anoxic life, stromatolites, BIF.
 * 3. Proterozoic (Nguyên Tân): 2.5 Ga to 0.541 Ga ago (Elapsed 2100 - 4059 Ma). GOE, eukaryotes, simple multicellularity.
 * 4. Phanerozoic (Hiển Tân): 0.541 Ga to present (Elapsed > 4059 Ma). Cambrian explosion, plants, animals, sapience.
 */

export type GeologicalEon = 'hadean' | 'archean' | 'proterozoic' | 'phanerozoic'

export interface GeologicalTimeSnapshot {
  readonly totalRotations: number
  readonly elapsedYears: number
  readonly elapsedMegaYears: number // Ma (10^6 years)
  readonly elapsedGigaYears: number // Ga (10^9 years)
  readonly currentEon: GeologicalEon
  readonly eonLabel: string
  readonly eonProgress: number // [0.0, 1.0] within the current eon
  readonly timeScaleDescription: string
  readonly biogenesisWindowOpen: boolean
  readonly greatOxidationEventThresholdReached: boolean
  readonly cambrianExplosionReached: boolean
}

export interface DeepTimeOptions {
  /** Planetary orbital period in rotations (days). Default 365.25 */
  daysPerYear?: number
  /**
   * Deep time scaling factor: simulation years elapsed per completed planetary rotation.
   * If omitted, 1 rotation = 1 day (1 / daysPerYear).
   * In epoch fast-forward mode, can be set to e.g. 100,000 or 1,000,000 years/rotation.
   */
  yearsPerRotation?: number
}

export const DAYS_PER_EARTH_YEAR = 365.25
export const MEGA_YEAR = 1_000_000
export const GIGA_YEAR = 1_000_000_000

// Geological Eon boundaries in elapsed Mega-years (Ma) from planet formation (T=0)
export const EON_BOUNDARIES_MA = {
  HADEAN_END: 600, // 4.6 Ga formation -> 4.0 Ga Archean boundary = 600 Ma elapsed
  ARCHEAN_END: 2100, // 4.0 Ga -> 2.5 Ga Proterozoic boundary = 2100 Ma elapsed
  PROTEROZOIC_END: 4059, // 2.5 Ga -> 0.541 Ga Phanerozoic boundary = 4059 Ma elapsed
  TOTAL_EARTH_AGE_MA: 4600, // Total planetary history = 4.6 Ga
} as const

export class DeepTimeEngine {
  /**
   * Computes a full GeologicalTimeSnapshot from the total planetary rotations.
   */
  static calculate(
    totalRotations: number,
    options: DeepTimeOptions = {}
  ): GeologicalTimeSnapshot {
    const daysPerYear = Math.max(1, options.daysPerYear ?? DAYS_PER_EARTH_YEAR)
    const yearsPerRot = options.yearsPerRotation ?? 1 / daysPerYear

    const safeRotations = Math.max(0, totalRotations)
    const elapsedYears = safeRotations * yearsPerRot
    const elapsedMegaYears = Number((elapsedYears / MEGA_YEAR).toFixed(4))
    const elapsedGigaYears = Number((elapsedYears / GIGA_YEAR).toFixed(6))

    // Determine Eon
    let currentEon: GeologicalEon = 'hadean'
    let eonLabel = 'Liên đại Hỏa Minh (Hadean)'
    let eonProgress = 0
    let timeScaleDescription = 'Vỏ hành tinh nguyên thủy nguội lạnh, va chạm thiên thạch dữ dội'

    if (elapsedMegaYears < EON_BOUNDARIES_MA.HADEAN_END) {
      currentEon = 'hadean'
      eonLabel = 'Liên đại Hỏa Minh (Hadean)'
      eonProgress = elapsedMegaYears / EON_BOUNDARIES_MA.HADEAN_END
      timeScaleDescription = 'Hóa học tiền sinh, nước lỏng tích tụ, bắn phá dữ dội cuối cùng'
    } else if (elapsedMegaYears < EON_BOUNDARIES_MA.ARCHEAN_END) {
      currentEon = 'archean'
      eonLabel = 'Liên đại Thái Cổ (Archean)'
      const eonSpan = EON_BOUNDARIES_MA.ARCHEAN_END - EON_BOUNDARIES_MA.HADEAN_END
      eonProgress = (elapsedMegaYears - EON_BOUNDARIES_MA.HADEAN_END) / eonSpan
      timeScaleDescription = 'Khí quyển khử kỵ khí, vi sinh vật nhân sơ sơ khai, trầm tích sắt dải BIF'
    } else if (elapsedMegaYears < EON_BOUNDARIES_MA.PROTEROZOIC_END) {
      currentEon = 'proterozoic'
      eonLabel = 'Liên đại Nguyên Tân (Proterozoic)'
      const eonSpan = EON_BOUNDARIES_MA.PROTEROZOIC_END - EON_BOUNDARIES_MA.ARCHEAN_END
      eonProgress = (elapsedMegaYears - EON_BOUNDARIES_MA.ARCHEAN_END) / eonSpan
      timeScaleDescription = 'Sự kiện Oxy hóa Lớn (GOE), tế bào nhân thực, tập đoàn đa bào sơ khai'
    } else {
      currentEon = 'phanerozoic'
      eonLabel = 'Liên đại Hiển Tân (Phanerozoic)'
      const elapsedPhanerozoic = elapsedMegaYears - EON_BOUNDARIES_MA.PROTEROZOIC_END
      const totalPhanerozoicSpan = EON_BOUNDARIES_MA.TOTAL_EARTH_AGE_MA - EON_BOUNDARIES_MA.PROTEROZOIC_END
      eonProgress = Math.min(1.0, elapsedPhanerozoic / totalPhanerozoicSpan)
      timeScaleDescription = 'Bùng nổ sinh giới Cambri, động thực vật phân hóa phức tạp, bình minh trí tuệ'
    }

    const biogenesisWindowOpen = elapsedMegaYears >= 400 && elapsedMegaYears <= 2500
    const greatOxidationEventThresholdReached = elapsedMegaYears >= 2200
    const cambrianExplosionReached = elapsedMegaYears >= EON_BOUNDARIES_MA.PROTEROZOIC_END

    return {
      totalRotations: safeRotations,
      elapsedYears,
      elapsedMegaYears,
      elapsedGigaYears,
      currentEon,
      eonLabel,
      eonProgress: Math.min(1.0, Math.max(0.0, Number(eonProgress.toFixed(4)))),
      timeScaleDescription,
      biogenesisWindowOpen,
      greatOxidationEventThresholdReached,
      cambrianExplosionReached,
    }
  }

  /**
   * Formats geological age into concise localized string.
   * e.g. "450.2 Ma", "1.24 Ga", or "12,450 năm".
   */
  static formatGeologicalAge(snapshot: GeologicalTimeSnapshot): string {
    if (snapshot.elapsedGigaYears >= 1.0) {
      return `${snapshot.elapsedGigaYears.toFixed(2)} Ga (Tỷ năm)`
    }
    if (snapshot.elapsedMegaYears >= 1.0) {
      return `${snapshot.elapsedMegaYears.toFixed(1)} Ma (Triệu năm)`
    }
    if (snapshot.elapsedYears >= 1.0) {
      return `${Math.round(snapshot.elapsedYears).toLocaleString()} năm`
    }
    return `${snapshot.totalRotations} vòng quay (Ngày)`
  }
}
