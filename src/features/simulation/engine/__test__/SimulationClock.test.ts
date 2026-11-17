import { describe, it, expect, beforeEach } from 'vitest'
import { SimulationClock } from '../SimulationClock.js'
import { ROTATION_DURATION_MS, SNAPSHOT_VERSION } from '../../../../shared/types/simulation-protocol.js'

describe('SimulationClock', () => {
  let clock: SimulationClock

  beforeEach(() => {
    clock = new SimulationClock()
  })

  describe('initial state', () => {
    it('starts in idle status', () => {
      expect(clock.getStatus()).toBe('idle')
    })

    it('starts at zero rotations', () => {
      expect(clock.getRotations()).toBe(0)
    })

    it('starts at 1x speed', () => {
      expect(clock.getSpeed()).toBe(1)
    })

    it('produces a valid initial snapshot', () => {
      const snapshot = clock.getSnapshot()
      expect(snapshot.rotations).toBe(0)
      expect(snapshot.partialRotation).toBe(0)
      expect(snapshot.status).toBe('idle')
      expect(snapshot.speed).toBe(1)
      expect(snapshot.version).toBe(SNAPSHOT_VERSION)
      expect(snapshot.totalPopulation).toBe(0)
    })
  })

  describe('start / pause / reset lifecycle', () => {
    it('transitions from idle to running on start', () => {
      clock.start()
      expect(clock.getStatus()).toBe('running')
    })

    it('transitions from running to paused on pause', () => {
      clock.start()
      clock.pause()
      expect(clock.getStatus()).toBe('paused')
    })

    it('transitions from paused to running on start', () => {
      clock.start()
      clock.pause()
      clock.start()
      expect(clock.getStatus()).toBe('running')
    })

    it('resets to initial state', () => {
      clock.start()
      clock.tick(5000)
      clock.reset()
      expect(clock.getStatus()).toBe('idle')
      expect(clock.getRotations()).toBe(0)
      expect(clock.getSpeed()).toBe(1)
    })

    it('does not transition from idle to paused', () => {
      clock.pause()
      expect(clock.getStatus()).toBe('idle')
    })
  })

  describe('tick mechanics', () => {
    it('does not advance when idle', () => {
      const completed = clock.tick(ROTATION_DURATION_MS)
      expect(completed).toBe(0)
      expect(clock.getRotations()).toBe(0)
    })

    it('does not advance when paused', () => {
      clock.start()
      clock.pause()
      const completed = clock.tick(ROTATION_DURATION_MS)
      expect(completed).toBe(0)
    })

    it('completes one rotation after ROTATION_DURATION_MS at 1x', () => {
      clock.start()
      const completed = clock.tick(ROTATION_DURATION_MS)
      expect(completed).toBe(1)
      expect(clock.getRotations()).toBe(1)
    })

    it('completes multiple rotations proportionally', () => {
      clock.start()
      const completed = clock.tick(ROTATION_DURATION_MS * 5)
      expect(completed).toBe(5)
      expect(clock.getRotations()).toBe(5)
    })

    it('accumulates partial rotation', () => {
      clock.start()
      clock.tick(ROTATION_DURATION_MS / 2)
      const snapshot = clock.getSnapshot()
      expect(snapshot.rotations).toBe(0)
      expect(snapshot.partialRotation).toBeCloseTo(0.5, 5)
    })

    it('accumulates across multiple ticks', () => {
      clock.start()
      clock.tick(ROTATION_DURATION_MS / 4)
      clock.tick(ROTATION_DURATION_MS / 4)
      clock.tick(ROTATION_DURATION_MS / 4)
      clock.tick(ROTATION_DURATION_MS / 4)
      expect(clock.getRotations()).toBe(1)
    })

    it('ignores negative delta', () => {
      clock.start()
      const completed = clock.tick(-1000)
      expect(completed).toBe(0)
      expect(clock.getRotations()).toBe(0)
    })
  })

  describe('time warp', () => {
    it('advances 10x faster at 10x speed', () => {
      clock.start()
      clock.setSpeed(10)
      const completed = clock.tick(ROTATION_DURATION_MS)
      expect(completed).toBe(10)
    })

    it('advances 100x faster at 100x speed', () => {
      clock.start()
      clock.setSpeed(100)
      const completed = clock.tick(ROTATION_DURATION_MS)
      expect(completed).toBe(100)
    })

    it('advances 1000x faster at 1000x speed', () => {
      clock.start()
      clock.setSpeed(1000)
      const completed = clock.tick(ROTATION_DURATION_MS)
      expect(completed).toBe(1000)
    })

    it('resets accumulator on speed change', () => {
      clock.start()
      clock.tick(ROTATION_DURATION_MS / 2) // partial at 1x
      clock.setSpeed(10)
      const snapshot = clock.getSnapshot()
      // Accumulator was reset on speed change
      expect(snapshot.partialRotation).toBe(0)
    })
  })

  describe('backlog handling', () => {
    it('caps accumulated delta to prevent spiral-of-death', () => {
      clock.start()
      // Simulate a massive lag spike (e.g., 60 seconds)
      const completed = clock.tick(60_000)
      // Should be capped, not 60 rotations
      expect(completed).toBeLessThanOrEqual(5)
    })
  })

  describe('pause does not accumulate', () => {
    it('does not increase rotations while paused', () => {
      clock.start()
      clock.tick(ROTATION_DURATION_MS * 2)
      expect(clock.getRotations()).toBe(2)
      clock.pause()
      clock.tick(ROTATION_DURATION_MS * 10)
      expect(clock.getRotations()).toBe(2)
      clock.start()
      clock.tick(ROTATION_DURATION_MS)
      expect(clock.getRotations()).toBe(3)
    })
  })

  describe('persistence export & restore', () => {
    it('exports and restores exact simulation clock state', () => {
      clock.start()
      clock.setSpeed(10)
      clock.tick(ROTATION_DURATION_MS * 3.5)
      expect(clock.getRotations()).toBe(35)

      const exported = clock.exportState()
      expect(exported.rotations).toBe(35)
      expect(exported.speed).toBe(10)
      expect(exported.status).toBe('running')

      const freshClock = new SimulationClock()
      freshClock.restoreState(exported)
      expect(freshClock.getRotations()).toBe(35)
      expect(freshClock.getSpeed()).toBe(10)
      expect(freshClock.getStatus()).toBe('running')
    })
  })
})

