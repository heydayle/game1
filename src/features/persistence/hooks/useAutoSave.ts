import { useState, useEffect, useRef } from 'react'
import type { PlanetConfig } from '../../genesis/types/genesis.js'
import type { WorldSave } from '../types.js'
import { AutoSaveService } from '../services/AutoSaveService.js'

interface UseAutoSaveOptions {
  isReady: boolean
  currentPlanet: PlanetConfig
  rotations: number
  exportState: (saveName?: string) => Promise<WorldSave>
  loadState: (save: WorldSave) => void
  loadPlanet: (planetConfig: PlanetConfig) => void
  onRestoringSave: () => void
}

export function useAutoSave({
  isReady,
  rotations,
  exportState,
  loadState,
  loadPlanet,
  onRestoringSave,
}: UseAutoSaveOptions) {
  const [restoredToast, setRestoredToast] = useState<string | null>(null)
  const lastSaveRef = useRef<WorldSave | null>(null)
  const isInitialLoadDoneRef = useRef(false)

  // 1. Initial Load: Check for existing auto-save when simulation worker is ready
  useEffect(() => {
    if (!isReady || isInitialLoadDoneRef.current) return
    isInitialLoadDoneRef.current = true

    const checkAndRestore = async () => {
      try {
        const autoSave = await AutoSaveService.loadAutoSave()
        if (autoSave && autoSave.clock.rotations > 0) {
          onRestoringSave()
          loadPlanet(autoSave.planetConfig)
          loadState(autoSave)
          lastSaveRef.current = autoSave
          setRestoredToast(
            `Đã tự động khôi phục tiến trình từ phiên trước (${autoSave.planetConfig.name} — Vòng quay ${autoSave.clock.rotations})`
          )
        }
      } catch (err) {
        console.error('Failed to auto-restore session:', err)
      }
    }

    checkAndRestore()
  }, [isReady, onRestoringSave, loadPlanet, loadState])

  // 2. Periodic background save cache every 8 seconds when rotations > 0
  useEffect(() => {
    if (!isReady || rotations === 0) return

    const interval = setInterval(async () => {
      try {
        const currentSave = await exportState('Auto-Save')
        lastSaveRef.current = currentSave
        await AutoSaveService.saveAutoSave(currentSave)
      } catch {
        // Silently skip if worker busy
      }
    }, 8000)

    return () => clearInterval(interval)
  }, [isReady, rotations, exportState])

  // 3. Save when user exits page: beforeunload, pagehide, and visibilitychange
  useEffect(() => {
    const handleExit = () => {
      // 1. Synchronously persist in-memory cache to localStorage immediately
      if (lastSaveRef.current && lastSaveRef.current.clock.rotations > 0) {
        AutoSaveService.saveAutoSave(lastSaveRef.current)
      }

      // 2. Request fresh export
      exportState('Auto-Save')
        .then((save) => {
          lastSaveRef.current = save
          AutoSaveService.saveAutoSave(save)
        })
        .catch(() => {})
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleExit()
      }
    }

    window.addEventListener('beforeunload', handleExit)
    window.addEventListener('pagehide', handleExit)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleExit)
      window.removeEventListener('pagehide', handleExit)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [exportState])

  // Auto-dismiss restored toast after 5s
  useEffect(() => {
    if (restoredToast) {
      const timer = setTimeout(() => setRestoredToast(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [restoredToast])

  return {
    restoredToast,
    dismissToast: () => setRestoredToast(null),
  }
}
