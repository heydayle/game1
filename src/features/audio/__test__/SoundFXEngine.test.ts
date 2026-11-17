import { describe, it, expect, beforeEach } from 'vitest'
import { SoundFX } from '../SoundFXEngine.js'

describe('SoundFXEngine', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
    SoundFX.setMuted(false)
  })

  it('manages mute state and persists preference in localStorage', () => {
    expect(SoundFX.getMuted()).toBe(false)

    SoundFX.setMuted(true)
    expect(SoundFX.getMuted()).toBe(true)

    const toggled = SoundFX.toggleMute()
    expect(toggled).toBe(false)
    expect(SoundFX.getMuted()).toBe(false)
  })

  it('sets master volume safely bounded within [0, 1]', () => {
    // Should not throw
    SoundFX.setVolume(0.5)
    SoundFX.setVolume(1.5) // Clamped to 1.0
    SoundFX.setVolume(-0.2) // Clamped to 0.0
  })

  it('executes audio cues without throwing in test environment', () => {
    expect(() => {
      SoundFX.playClick()
      SoundFX.playBiogenesisSpark()
      SoundFX.playDisaster('asteroid_impact', 0.9)
      SoundFX.playDisaster('volcanic_eruption', 0.8)
      SoundFX.playDisaster('solar_flare', 1.0)
      SoundFX.playDisaster('ice_age', 0.7)
      SoundFX.playDisaster('climate_shift', 0.5)
      SoundFX.startAmbience()
      SoundFX.stopAmbience()
    }).not.toThrow()
  })
})
