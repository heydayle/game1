import { describe, it, expect } from 'vitest'
import {
  cartesianToLatLong,
  latLongToCartesian,
  classifyBiome,
  calculateRotationAngle,
} from '../planet-math.js'

describe('planet-math utilities', () => {
  describe('cartesianToLatLong', () => {
    it('identifies North Pole correctly', () => {
      const coord = cartesianToLatLong(0, 1, 0)
      expect(coord.latitude).toBeCloseTo(90, 1)
    })

    it('identifies South Pole correctly', () => {
      const coord = cartesianToLatLong(0, -1, 0)
      expect(coord.latitude).toBeCloseTo(-90, 1)
    })

    it('identifies Equator correctly', () => {
      const coord = cartesianToLatLong(0, 0, 1)
      expect(coord.latitude).toBeCloseTo(0, 1)
      expect(coord.longitude).toBeCloseTo(0, 1)
    })

    it('handles zero vector without NaN', () => {
      const coord = cartesianToLatLong(0, 0, 0)
      expect(coord.latitude).toBe(0)
      expect(coord.longitude).toBe(0)
    })
  })

  describe('latLongToCartesian roundtrip', () => {
    it('converts LatLong to Cartesian and back accurately', () => {
      const targetLat = 45
      const targetLong = 90
      const [x, y, z] = latLongToCartesian(targetLat, targetLong, 1)

      const result = cartesianToLatLong(x, y, z)
      expect(result.latitude).toBeCloseTo(targetLat, 0)
      expect(result.longitude).toBeCloseTo(targetLong, 0)
    })
  })

  describe('classifyBiome', () => {
    it('classifies ice caps above threshold latitude', () => {
      expect(classifyBiome(0.5, 75, 0.5, 70)).toBe('ice_cap')
      expect(classifyBiome(0.5, -80, 0.5, 70)).toBe('ice_cap')
    })

    it('classifies deep ocean for low elevation below ocean level', () => {
      expect(classifyBiome(0.2, 0, 0.5)).toBe('deep_ocean')
    })

    it('classifies shallow ocean near ocean level', () => {
      expect(classifyBiome(0.45, 0, 0.5)).toBe('shallow_ocean')
    })

    it('classifies beach just above ocean level', () => {
      expect(classifyBiome(0.52, 0, 0.5)).toBe('beach')
    })

    it('classifies lowland plains', () => {
      expect(classifyBiome(0.65, 0, 0.5)).toBe('lowland')
    })

    it('classifies highlands and mountains at higher elevations', () => {
      expect(classifyBiome(0.85, 0, 0.5)).toBe('highland')
      expect(classifyBiome(0.95, 0, 0.5)).toBe('mountain')
    })
  })

  describe('calculateRotationAngle', () => {
    it('computes 0 radians at rotation 0', () => {
      expect(calculateRotationAngle(0, 0)).toBe(0)
    })

    it('computes 2pi radians at 1 rotation', () => {
      expect(calculateRotationAngle(1, 0)).toBeCloseTo(2 * Math.PI, 5)
    })

    it('handles partial rotations', () => {
      expect(calculateRotationAngle(0, 0.5)).toBeCloseTo(Math.PI, 5)
    })
  })
})

