/**
 * SoundFXEngine — Procedural Web Audio API sound synthesizer.
 *
 * Generates all audio cues procedurally in real-time with zero external assets:
 * - Tactile UI interaction clicks
 * - Disaster impact rumble, solar sweeps, and ice chimes
 * - Biogenesis crystalline arpeggios
 * - Deep space cosmic ambient drone
 *
 * Gracefully no-ops in non-browser or test environments.
 */

import type { DisasterType } from '../disasters/types.js'

class SoundFXEngineImpl {
  private ctx: AudioContext | null = null
  private isMuted = false
  private masterVolume = 0.3
  private ambientOsc1: OscillatorNode | null = null
  private ambientOsc2: OscillatorNode | null = null
  private ambientGain: GainNode | null = null
  private isAmbienceRunning = false

  constructor() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const savedMute = localStorage.getItem('evolution_sound_muted')
      this.isMuted = savedMute === 'true'
    }
  }

  private initContext(): AudioContext | null {
    if (this.ctx) return this.ctx
    if (typeof window === 'undefined') return null

    const AudioContextClass =
      window.AudioContext ||
      // @ts-expect-error webkit prefix fallback
      window.webkitAudioContext

    if (!AudioContextClass) return null

    try {
      this.ctx = new AudioContextClass()
      if (this.ctx.state === 'suspended') {
        const resumeOnInteraction = () => {
          this.ctx?.resume()
          window.removeEventListener('click', resumeOnInteraction)
          window.removeEventListener('keydown', resumeOnInteraction)
        }
        window.addEventListener('click', resumeOnInteraction, { once: true })
        window.addEventListener('keydown', resumeOnInteraction, { once: true })
      }
      return this.ctx
    } catch {
      return null
    }
  }

  public getMuted(): boolean {
    return this.isMuted
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem('evolution_sound_muted', muted ? 'true' : 'false')
    }
    if (muted) {
      this.stopAmbience()
    } else {
      this.startAmbience()
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted)
    return this.isMuted
  }

  public setVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume))
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(
        this.masterVolume * 0.08,
        this.ctx.currentTime
      )
    }
  }

  /**
   * Subtle tactile UI click.
   */
  public playClick(): void {
    if (this.isMuted) return
    const ctx = this.initContext()
    if (!ctx) return

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(2200, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.03)

      gain.gain.setValueAtTime(this.masterVolume * 0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(ctx.currentTime + 0.035)
    } catch {
      // Ignore audio scheduling errors
    }
  }

  /**
   * Procedural disaster sound effects modulated by severity.
   */
  public playDisaster(type: DisasterType, severity = 0.8): void {
    if (this.isMuted) return
    const ctx = this.initContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const effectiveVol = this.masterVolume * Math.min(1, severity * 0.9)

      switch (type) {
        case 'asteroid_impact': {
          // Low-end impact boom + decaying noise burst
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'triangle'
          osc.frequency.setValueAtTime(120, now)
          osc.frequency.exponentialRampToValueAtTime(28, now + 0.6)

          gain.gain.setValueAtTime(effectiveVol * 0.6, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65)

          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(now)
          osc.stop(now + 0.7)
          break
        }

        case 'volcanic_eruption': {
          // Deep subterranean rumble
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'sawtooth'
          osc.frequency.setValueAtTime(55, now)
          osc.frequency.linearRampToValueAtTime(35, now + 0.8)

          gain.gain.setValueAtTime(effectiveVol * 0.35, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85)

          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(now)
          osc.stop(now + 0.9)
          break
        }

        case 'solar_flare': {
          // Upward ionizing shimmer sweep
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(320, now)
          osc.frequency.exponentialRampToValueAtTime(1400, now + 0.5)

          gain.gain.setValueAtTime(effectiveVol * 0.25, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55)

          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(now)
          osc.stop(now + 0.6)
          break
        }

        case 'ice_age': {
          // Dual glassy frost resonant chimes
          const freqs = [880, 1318.5]
          freqs.forEach((freq, idx) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.type = 'sine'
            osc.frequency.setValueAtTime(freq, now + idx * 0.08)

            gain.gain.setValueAtTime(effectiveVol * 0.2, now + idx * 0.08)
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.6)

            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.start(now + idx * 0.08)
            osc.stop(now + idx * 0.08 + 0.65)
          })
          break
        }

        case 'climate_shift': {
          // Atmospheric wind shear
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'triangle'
          osc.frequency.setValueAtTime(180, now)
          osc.frequency.linearRampToValueAtTime(110, now + 0.45)

          gain.gain.setValueAtTime(effectiveVol * 0.2, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)

          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(now)
          osc.stop(now + 0.55)
          break
        }
      }
    } catch {
      // Audio error no-op
    }
  }

  /**
   * Ascending harmonic crystalline arpeggio when biogenesis sparks.
   */
  public playBiogenesisSpark(): void {
    if (this.isMuted) return
    const ctx = this.initContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      // C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
      const notes = [523.25, 659.25, 783.99, 1046.5]
      notes.forEach((freq, i) => {
        const noteStart = now + i * 0.07
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, noteStart)

        gain.gain.setValueAtTime(0.001, noteStart)
        gain.gain.exponentialRampToValueAtTime(this.masterVolume * 0.22, noteStart + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.22)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(noteStart)
        osc.stop(noteStart + 0.25)
      })
    } catch {
      // Audio error no-op
    }
  }

  /**
   * Starts ambient cosmic sub-bass drone.
   */
  public startAmbience(): void {
    if (this.isMuted || this.isAmbienceRunning) return
    const ctx = this.initContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(95, now)

      this.ambientGain = ctx.createGain()
      this.ambientGain.gain.setValueAtTime(0.001, now)
      this.ambientGain.gain.exponentialRampToValueAtTime(
        this.masterVolume * 0.06,
        now + 1.5
      )

      this.ambientOsc1 = ctx.createOscillator()
      this.ambientOsc1.type = 'sine'
      this.ambientOsc1.frequency.setValueAtTime(42, now)

      this.ambientOsc2 = ctx.createOscillator()
      this.ambientOsc2.type = 'sine'
      this.ambientOsc2.frequency.setValueAtTime(42.5, now) // Sub-hertz detune binaural beat

      this.ambientOsc1.connect(filter)
      this.ambientOsc2.connect(filter)
      filter.connect(this.ambientGain)
      this.ambientGain.connect(ctx.destination)

      this.ambientOsc1.start()
      this.ambientOsc2.start()
      this.isAmbienceRunning = true
    } catch {
      // Audio error no-op
    }
  }

  /**
   * Stops cosmic ambient drone smoothly.
   */
  public stopAmbience(): void {
    if (!this.isAmbienceRunning) return
    try {
      if (this.ambientGain && this.ctx) {
        this.ambientGain.gain.exponentialRampToValueAtTime(
          0.0001,
          this.ctx.currentTime + 0.5
        )
      }
      setTimeout(() => {
        this.ambientOsc1?.stop()
        this.ambientOsc2?.stop()
        this.ambientOsc1?.disconnect()
        this.ambientOsc2?.disconnect()
        this.ambientOsc1 = null
        this.ambientOsc2 = null
        this.ambientGain = null
        this.isAmbienceRunning = false
      }, 500)
    } catch {
      this.isAmbienceRunning = false
    }
  }
}

export const SoundFX = new SoundFXEngineImpl()
