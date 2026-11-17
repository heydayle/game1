import { create } from 'zustand'
import { GenesisEngine } from '../features/genesis/services/GenesisEngine.js'
import type { PlanetConfig } from '../features/genesis/types/genesis.js'

interface PlanetState {
  currentPlanet: PlanetConfig
  isGenesisModalOpen: boolean
  answers: Record<number, string>
  openGenesisModal: () => void
  closeGenesisModal: () => void
  setAnswer: (questionId: number, choiceId: string) => void
  commitGenesis: (seed?: number) => PlanetConfig
  randomizePlanet: () => PlanetConfig
  loadPlanet: (planetConfig: PlanetConfig) => void
  loadDefaultPlanet: () => PlanetConfig
}

// Default initial world (Balanced Genesis)
const DEFAULT_ANSWERS: Record<number, string> = {
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

const INITIAL_PLANET = GenesisEngine.generatePlanet(DEFAULT_ANSWERS, 42)

export const usePlanetStore = create<PlanetState>((set, get) => ({
  currentPlanet: INITIAL_PLANET,
  isGenesisModalOpen: false,
  answers: DEFAULT_ANSWERS,

  openGenesisModal: () => set({ isGenesisModalOpen: true }),
  closeGenesisModal: () => set({ isGenesisModalOpen: false }),

  setAnswer: (questionId: number, choiceId: string) => {
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: choiceId,
      },
    }))
  },

  commitGenesis: (customSeed?: number) => {
    const { answers } = get()
    const newPlanet = GenesisEngine.generatePlanet(answers, customSeed)
    set({
      currentPlanet: newPlanet,
      isGenesisModalOpen: false,
    })
    return newPlanet
  },

  randomizePlanet: () => {
    const randomSeed = Math.floor(Math.random() * 1000000)
    const { answers } = get()
    const newPlanet = GenesisEngine.generatePlanet(answers, randomSeed)
    set({ currentPlanet: newPlanet })
    return newPlanet
  },

  loadPlanet: (planetConfig: PlanetConfig) => {
    set({
      currentPlanet: planetConfig,
      isGenesisModalOpen: false,
    })
  },

  loadDefaultPlanet: () => {
    const defaultPlanet = GenesisEngine.generatePlanet(DEFAULT_ANSWERS, 42)
    set({
      currentPlanet: defaultPlanet,
      answers: DEFAULT_ANSWERS,
      isGenesisModalOpen: false,
    })
    return defaultPlanet
  },
}))

