/**
 * Math utilities for planetary coordinates and procedural calculations.
 */

export interface LatLong {
  latitude: number // Degrees: -90 (South Pole) to +90 (North Pole)
  longitude: number // Degrees: -180 to +180
}

export type BiomeType =
  | 'deep_ocean'
  | 'shallow_ocean'
  | 'beach'
  | 'lowland'
  | 'highland'
  | 'mountain'
  | 'ice_cap'

/**
 * Converts a 3D unit sphere Cartesian vector to Latitude and Longitude.
 */
export function cartesianToLatLong(x: number, y: number, z: number): LatLong {
  const radius = Math.sqrt(x * x + y * y + z * z)
  if (radius === 0) {
    return { latitude: 0, longitude: 0 }
  }

  const normalizedY = Math.max(-1, Math.min(1, y / radius))
  const latitude = (Math.asin(normalizedY) * 180) / Math.PI
  const longitude = (Math.atan2(x, z) * 180) / Math.PI

  return {
    latitude: Math.round(latitude * 100) / 100,
    longitude: Math.round(longitude * 100) / 100,
  }
}

/**
 * Converts Latitude and Longitude (degrees) to 3D Cartesian coordinates on a sphere of given radius.
 */
export function latLongToCartesian(
  latitude: number,
  longitude: number,
  radius = 1
): [number, number, number] {
  const latRad = (latitude * Math.PI) / 180
  const lonRad = (longitude * Math.PI) / 180

  const x = radius * Math.cos(latRad) * Math.sin(lonRad)
  const y = radius * Math.sin(latRad)
  const z = radius * Math.cos(latRad) * Math.cos(lonRad)

  return [x, y, z]
}

/**
 * Determines approximate biome based on elevation and latitude.
 * Exactly mirrors the elevation and thermal thresholds encoded in the GLSL procedural shader.
 */
export function classifyBiome(
  elevation: number,
  latitudeDeg: number,
  oceanLevel = 0.5,
  iceCapLatitude = 70
): BiomeType {
  const absLat = Math.abs(latitudeDeg)

  if (absLat >= iceCapLatitude) {
    return 'ice_cap'
  }

  if (elevation < oceanLevel - 0.12) {
    return 'deep_ocean'
  }
  if (elevation < oceanLevel) {
    return 'shallow_ocean'
  }
  if (elevation < oceanLevel + 0.04) {
    return 'beach'
  }
  if (elevation < oceanLevel + 0.22) {
    return 'lowland'
  }
  if (elevation < oceanLevel + 0.36) {
    return 'highland'
  }
  return 'mountain'
}

/**
 * Calculates current rotation angle in radians given rotation count and partial rotation.
 */
export function calculateRotationAngle(
  rotations: number,
  partialRotation: number
): number {
  return (rotations + partialRotation) * 2 * Math.PI
}

