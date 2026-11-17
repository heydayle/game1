import { useState, useMemo, useEffect } from 'react'
import { GENESIS_QUESTIONS } from '../data/genesis-questions.js'
import { GenesisEngine } from '../services/GenesisEngine.js'
import { usePlanetStore } from '../../../stores/planet-store.js'
import type { PlanetConfig } from '../types/genesis.js'

export function GenesisModal() {
  const { isGenesisModalOpen, closeGenesisModal, answers, setAnswer, commitGenesis } =
    usePlanetStore()

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [viewState, setViewState] = useState<'quiz' | 'dossier'>('quiz')
  const [previewPlanet, setPreviewPlanet] = useState<PlanetConfig | null>(null)

  // Reset to first question and quiz view whenever modal is opened
  useEffect(() => {
    if (isGenesisModalOpen) {
      setCurrentQuestionIndex(0)
      setViewState('quiz')
    }
  }, [isGenesisModalOpen])

  // Escape key closes the Genesis modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isGenesisModalOpen) {
        closeGenesisModal()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isGenesisModalOpen, closeGenesisModal])

  const currentQuestion = GENESIS_QUESTIONS[currentQuestionIndex]
  const totalQuestions = GENESIS_QUESTIONS.length
  const selectedChoiceId = currentQuestion ? answers[currentQuestion.id] : undefined

  // Compute live preview whenever reaching dossier stage or on-demand
  const computedPreview = useMemo(() => {
    return GenesisEngine.generatePlanet(answers)
  }, [answers])

  if (!isGenesisModalOpen) return null

  const handleSelectChoice = (choiceId: string) => {
    if (!currentQuestion) return
    setAnswer(currentQuestion.id, choiceId)
  }

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    } else {
      setPreviewPlanet(computedPreview)
      setViewState('dossier')
    }
  }

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  const handleCommit = () => {
    commitGenesis(previewPlanet?.seed)
    setViewState('quiz')
    setCurrentQuestionIndex(0)
  }

  const handleRestartQuiz = () => {
    setViewState('quiz')
    setCurrentQuestionIndex(0)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-white/15 bg-gray-950 font-sans shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-gray-900/60">
          <div>
            <h2 className="text-base font-semibold tracking-wide text-white uppercase font-mono">
              {viewState === 'quiz' ? 'Genesis Protocol' : 'Planetary Dossier'}
            </h2>
            <p className="text-xs text-gray-400">
              {viewState === 'quiz'
                ? `Phase 3 — Shaping Planetary Attributes (${currentQuestionIndex + 1}/${totalQuestions})`
                : 'Cosmic Parameters Initialized'}
            </p>
          </div>
          <button
            onClick={closeGenesisModal}
            className="rounded p-1 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        {viewState === 'quiz' && currentQuestion ? (
          <div className="flex flex-1 flex-col overflow-y-auto p-6">
            {/* Progress Bar */}
            <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
              <div
                className="h-full bg-blue-500 transition-all duration-300 ease-out"
                style={{
                  width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
                }}
              />
            </div>

            {/* Question Details */}
            <div className="mb-5">
              <span className="text-[11px] font-semibold tracking-wider text-blue-400 uppercase font-mono">
                {currentQuestion.category}
              </span>
              <h3 className="text-lg font-medium text-white">
                {currentQuestion.title}
              </h3>
              <p className="mt-1 text-sm text-gray-300 leading-relaxed">
                {currentQuestion.prompt}
              </p>
            </div>

            {/* Choices */}
            <div className="space-y-3">
              {currentQuestion.choices.map((choice) => {
                const isSelected = selectedChoiceId === choice.id
                return (
                  <button
                    key={choice.id}
                    onClick={() => handleSelectChoice(choice.id)}
                    className={`w-full rounded-lg border p-4 text-left transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-950/40 shadow-lg shadow-blue-950/30 ring-1 ring-blue-500'
                        : 'border-white/10 bg-gray-900/40 hover:border-white/20 hover:bg-gray-900/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">
                        {choice.title}
                      </span>
                      <span
                        className={`h-4 w-4 rounded-full border flex items-center justify-center text-[10px] ${
                          isSelected
                            ? 'border-blue-400 bg-blue-500 text-white'
                            : 'border-gray-600'
                        }`}
                      >
                        {isSelected ? '✓' : ''}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-blue-300/80 font-mono">
                      {choice.subtitle}
                    </p>
                    <p className="mt-2 text-xs text-gray-400 leading-normal">
                      {choice.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          /* Dossier View */
          <div className="flex flex-1 flex-col overflow-y-auto p-6 font-mono text-xs text-gray-300">
            {previewPlanet && (
              <div className="space-y-5">
                {/* Planet Identity */}
                <div className="flex items-baseline justify-between border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[10px] text-gray-400 tracking-wider uppercase">
                      Designation
                    </span>
                    <h3 className="text-xl font-bold text-white tracking-wide">
                      {previewPlanet.name}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 tracking-wider uppercase">
                      Cosmic Seed
                    </span>
                    <p className="text-sm font-semibold text-blue-400">
                      #{previewPlanet.seed}
                    </p>
                  </div>
                </div>

                {/* Primary Physical Metrics */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg bg-gray-900/70 p-3 border border-white/5">
                    <span className="text-gray-400 text-[10px] uppercase">
                      Star Distance
                    </span>
                    <p className="text-base font-semibold text-white mt-0.5">
                      {previewPlanet.starDistanceAU} AU
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-900/70 p-3 border border-white/5">
                    <span className="text-gray-400 text-[10px] uppercase">
                      Surface Temp
                    </span>
                    <p className="text-base font-semibold text-amber-300 mt-0.5">
                      {previewPlanet.surfaceTemperatureCelsius}°C
                    </p>
                    <span className="text-[10px] text-gray-400">
                      ({previewPlanet.surfaceTemperatureKelvin} K)
                    </span>
                  </div>
                  <div className="rounded-lg bg-gray-900/70 p-3 border border-white/5">
                    <span className="text-gray-400 text-[10px] uppercase">
                      Axial Tilt
                    </span>
                    <p className="text-base font-semibold text-white mt-0.5">
                      {previewPlanet.axialTiltDeg}°
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-900/70 p-3 border border-white/5">
                    <span className="text-gray-400 text-[10px] uppercase">
                      Day Length
                    </span>
                    <p className="text-base font-semibold text-white mt-0.5">
                      {previewPlanet.rotationPeriodHours}h
                    </p>
                  </div>
                </div>

                {/* Atmospheric Breakdown */}
                <div className="rounded-lg bg-gray-900/60 p-3.5 border border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      Atmosphere ({previewPlanet.atmosphericComposition.pressureAtm} atm)
                    </span>
                    <span
                      className="inline-block h-3 w-3 rounded-full border border-white/20"
                      style={{ backgroundColor: previewPlanet.atmosphereColor }}
                      title="Atmosphere Tint"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div>
                      <span className="text-gray-400">N₂:</span>{' '}
                      <span className="text-white font-medium">
                        {previewPlanet.atmosphericComposition.nitrogen}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">O₂:</span>{' '}
                      <span className="text-emerald-400 font-medium">
                        {previewPlanet.atmosphericComposition.oxygen}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">CO₂:</span>{' '}
                      <span className="text-amber-400 font-medium">
                        {previewPlanet.atmosphericComposition.carbonDioxide}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">CH₄:</span>{' '}
                      <span className="text-teal-400 font-medium">
                        {previewPlanet.atmosphericComposition.methane}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">H₂O:</span>{' '}
                      <span className="text-cyan-400 font-medium">
                        {previewPlanet.atmosphericComposition.waterVapor}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Inert:</span>{' '}
                      <span className="text-white font-medium">
                        {previewPlanet.atmosphericComposition.nobleGases}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Elemental & Environmental Conditions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg bg-gray-900/60 p-3.5 border border-white/5">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                      Elemental Crust
                    </span>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Silicates & Rock:</span>
                        <span className="text-white">
                          {previewPlanet.elementalComposition.silicatesRock}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Iron & Heavy Metals:</span>
                        <span className="text-white">
                          {previewPlanet.elementalComposition.ironMetals}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Hydrosphere / Volatiles:</span>
                        <span className="text-cyan-400">
                          {previewPlanet.elementalComposition.waterVolatiles}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Carbon & Organics:</span>
                        <span className="text-emerald-400">
                          {previewPlanet.elementalComposition.carbonOrganics}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-900/60 p-3.5 border border-white/5">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                      Evolutionary Baseline
                    </span>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Selection Pressure:</span>
                        <span className="text-white font-medium">
                          {(previewPlanet.environmentalConditions.selectionPressure * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Mutation Multiplier:</span>
                        <span className="text-white font-medium">
                          {previewPlanet.environmentalConditions.mutationRateMultiplier}x
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Tectonic State:</span>
                        <span className="text-white uppercase text-[10px] font-medium">
                          {previewPlanet.environmentalConditions.tectonicStability}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Radiation Sieve:</span>
                        <span className="text-white uppercase text-[10px] font-medium">
                          {previewPlanet.environmentalConditions.radiationLevel}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between border-t border-white/10 px-6 py-4 bg-gray-900/60">
          {viewState === 'quiz' ? (
            <>
              <button
                onClick={handlePrev}
                disabled={currentQuestionIndex === 0}
                className="rounded border border-white/10 px-4 py-1.5 text-xs font-medium text-gray-300 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={handleNext}
                className="rounded bg-blue-600 px-5 py-1.5 text-xs font-medium text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/30"
              >
                {currentQuestionIndex === totalQuestions - 1
                  ? 'Review Dossier'
                  : 'Next Question'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleRestartQuiz}
                className="rounded border border-white/10 px-4 py-1.5 text-xs font-medium text-gray-300 hover:bg-white/5 transition-colors"
              >
                Modify Choices
              </button>
              <button
                onClick={handleCommit}
                className="rounded bg-emerald-600 px-6 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/30"
              >
                Awaken Planet
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

