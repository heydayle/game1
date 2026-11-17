import { useState, useEffect, useRef } from 'react'
import { IndexedDBService } from '../services/IndexedDBService.js'
import { SaveValidator } from '../services/SaveValidator.js'
import { AUTOSAVE_SAVE_ID } from '../services/AutoSaveService.js'
import type { WorldSave, WorldSaveMetadata } from '../types.js'
import type { PlanetConfig } from '../../genesis/types/genesis.js'

interface SaveManagerModalProps {
  isOpen: boolean
  onClose: () => void
  currentPlanet: PlanetConfig
  currentRotations: number
  onExportCurrentState: (name?: string) => Promise<WorldSave>
  onLoadState: (save: WorldSave) => void
  onPlanetLoaded: (planetConfig: PlanetConfig) => void
}

export function SaveManagerModal({
  isOpen,
  onClose,
  currentPlanet,
  currentRotations,
  onExportCurrentState,
  onLoadState,
  onPlanetLoaded,
}: SaveManagerModalProps) {
  const [saves, setSaves] = useState<WorldSaveMetadata[]>([])
  const [customName, setCustomName] = useState('')
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(
    null
  )
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      loadSaveList()
      setCustomName(`${currentPlanet.name} — Rot ${currentRotations}`)
      setStatusMessage(null)
    }
  }, [isOpen, currentPlanet.name, currentRotations])

  // Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Auto-dismiss status message after 4s
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [statusMessage])

  const loadSaveList = async () => {
    try {
      const list = await IndexedDBService.listSaves()
      setSaves(list)
    } catch (err) {
      console.error('Failed to list saves:', err)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setStatusMessage(null)
    try {
      const saveName = customName.trim() || `${currentPlanet.name} — Rot ${currentRotations}`
      const worldSave = await onExportCurrentState(saveName)
      await IndexedDBService.saveWorld(worldSave)
      await loadSaveList()
      setStatusMessage({ text: `World archive "${saveName}" saved successfully!` })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Save operation failed'
      setStatusMessage({ text: msg, isError: true })
    } finally {
      setIsSaving(false)
    }
  }

  const handleLoad = async (saveId: string) => {
    setStatusMessage(null)
    try {
      const save = await IndexedDBService.loadWorld(saveId)
      if (!save) {
        setStatusMessage({ text: 'Could not find save data in storage', isError: true })
        return
      }
      onPlanetLoaded(save.planetConfig)
      onLoadState(save)
      setStatusMessage({ text: `Restored world: ${save.metadata.name}` })
      setTimeout(() => {
        onClose()
      }, 700)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load world'
      setStatusMessage({ text: msg, isError: true })
    }
  }

  const handleDelete = async (saveId: string, name: string) => {
    if (!confirm(`Delete archive "${name}" permanently?`)) return
    try {
      await IndexedDBService.deleteSave(saveId)
      await loadSaveList()
      setStatusMessage({ text: `Archive "${name}" deleted` })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Delete failed'
      setStatusMessage({ text: msg, isError: true })
    }
  }

  const handleExportJson = async (saveId: string) => {
    try {
      const save = await IndexedDBService.loadWorld(saveId)
      if (!save) return
      const jsonStr = SaveValidator.serializeToJson(save)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const sanitizedName = save.metadata.name.replace(/[^a-zA-Z0-9_-]/g, '_')
      link.href = url
      link.download = `${sanitizedName}-dossier.json`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Export failed'
      setStatusMessage({ text: msg, isError: true })
    }
  }

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string
        const validation = SaveValidator.parseFromJson(text)
        if (!validation.isValid || !validation.save) {
          setStatusMessage({
            text: `Import failed: ${validation.error || 'Corrupted dossier format'}`,
            isError: true,
          })
          return
        }

        // Save imported world into IndexedDB
        await IndexedDBService.saveWorld(validation.save)
        await loadSaveList()
        setStatusMessage({
          text: `Imported world "${validation.save.metadata.name}" successfully!`,
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Import parse error'
        setStatusMessage({ text: msg, isError: true })
      }
    }
    reader.readAsText(file)
    // Reset file input so user can import the same file again if edited
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 font-mono select-none">
      <div className="relative w-full max-w-3xl rounded-xl border border-cyan-500/30 bg-gray-950/95 p-6 shadow-2xl text-gray-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">💾</span>
            <div>
              <h2 className="text-base font-bold tracking-wider text-cyan-400 uppercase">
                World Archives & Persistence Protocol
              </h2>
              <p className="text-xs text-gray-400">
                IndexedDB Local Storage & Dossier Serialization (Schema v1)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div
            className={`mt-4 rounded px-3 py-2 text-xs border ${
              statusMessage.isError
                ? 'border-red-500/50 bg-red-950/40 text-red-300'
                : 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {/* Save Current World Action Bar */}
        <div className="mt-4 rounded-lg border border-gray-800 bg-gray-900/60 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Archive Current State
          </h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Archive Slot Name"
              className="flex-1 rounded bg-black/60 border border-gray-700 px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
            />
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 px-4 py-1.5 text-xs font-bold text-white transition-all shadow-md flex items-center justify-center gap-2"
            >
              {isSaving ? 'Saving...' : '💾 Archive World'}
            </button>
          </div>
        </div>

        {/* Saved Slots Roster */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 flex justify-between items-center">
            <span>Stored Planetary Archives ({saves.length})</span>
            <label className="cursor-pointer text-cyan-400 hover:text-cyan-300 transition-colors text-xs flex items-center gap-1">
              <span>↥ Import JSON Dossier</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportJson}
                className="hidden"
              />
            </label>
          </h3>

          {saves.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-800 p-8 text-center text-xs text-gray-500">
              No planetary archives saved yet. Save your current world state or import a JSON dossier.
            </div>
          ) : (
            <div className="space-y-2">
              {saves.map((meta) => {
                const dateStr = new Date(meta.savedAt).toLocaleString()
                const isPrebiotic = meta.lifeStage === 'prebiotic'
                return (
                  <div
                    key={meta.saveId}
                    className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-gray-800 bg-gray-900/40 p-3 hover:border-gray-700 transition-all gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-xs">{meta.name}</span>
                        {meta.saveId === AUTOSAVE_SAVE_ID && (
                          <span className="rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.2 text-[9px] font-bold uppercase font-mono">
                            ⚡ Auto-Save
                          </span>
                        )}
                        <span
                          className={`rounded px-1.5 py-0.2 text-[10px] font-bold uppercase ${
                            isPrebiotic
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {meta.lifeStage}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-400">
                        <span>Planet: {meta.planetName}</span>
                        <span>Rot: {meta.rotations}</span>
                        <span>Pop: {meta.totalPopulation.toLocaleString()}</span>
                        <span>Species: {meta.activeSpeciesCount}</span>
                        <span className="text-gray-500">{dateStr}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleLoad(meta.saveId)}
                        className="rounded bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white transition-colors"
                        title="Load World State"
                      >
                        ▶ Load
                      </button>
                      <button
                        onClick={() => handleExportJson(meta.saveId)}
                        className="rounded bg-gray-800 hover:bg-gray-700 px-2 py-1 text-xs text-gray-300 border border-white/10 transition-colors"
                        title="Export JSON Dossier"
                      >
                        ⤓ JSON
                      </button>
                      <button
                        onClick={() => handleDelete(meta.saveId, meta.name)}
                        className="rounded bg-red-950/50 hover:bg-red-900/80 px-2 py-1 text-xs text-red-300 border border-red-500/20 transition-colors"
                        title="Delete Archive"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 border-t border-gray-800 pt-3 flex justify-between items-center text-[11px] text-gray-500">
          <span>Deterministically versioned (V1) & compatible with all simulation stages.</span>
          <button
            onClick={onClose}
            className="rounded bg-gray-800 px-3 py-1 text-xs text-gray-300 hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

