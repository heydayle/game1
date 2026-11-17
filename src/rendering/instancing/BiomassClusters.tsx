import { useRef, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { BiomeCellSummary } from '../../features/environment/climate/types.js'

interface BiomassClustersProps {
  radius?: number
  biomeCells: readonly BiomeCellSummary[]
}

const MAX_CLUSTERS = 128
const UP_VECTOR = new THREE.Vector3(0, 1, 0)

export function BiomassClusters({
  radius = 1.6,
  biomeCells,
}: BiomassClustersProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)

  // Identify active inhabited cells
  const activeCells = useMemo(() => {
    return biomeCells.filter((c) => c.biomassDensity > 0)
  }, [biomeCells])

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return

    const dummy = new THREE.Object3D()
    const colorHelper = new THREE.Color()
    const normal = new THREE.Vector3()
    const count = Math.min(activeCells.length, MAX_CLUSTERS)

    for (let i = 0; i < count; i++) {
      const cell = activeCells[i]!
      const [nx, ny, nz] = cell.center
      normal.set(nx, ny, nz).normalize()

      // Position just above the planet surface
      const surfaceRadius = radius * 1.018
      dummy.position.set(normal.x * surfaceRadius, normal.y * surfaceRadius, normal.z * surfaceRadius)

      // Orient strictly outward along surface normal
      dummy.quaternion.setFromUnitVectors(UP_VECTOR, normal)

      // Scale proportionally to biomass density
      const scale = 0.5 + cell.biomassDensity * 1.2
      dummy.scale.set(scale, scale, scale * 1.3)
      dummy.updateMatrix()

      mesh.setMatrixAt(i, dummy.matrix)

      // Color instance by resident species lineage
      if (cell.residentSpeciesColor) {
        colorHelper.set(cell.residentSpeciesColor)
        mesh.setColorAt(i, colorHelper)
      } else {
        colorHelper.set('#10b981')
        mesh.setColorAt(i, colorHelper)
      }
    }

    // Hide any unused instance slots
    for (let i = count; i < MAX_CLUSTERS; i++) {
      dummy.position.set(0, 0, 0)
      dummy.scale.set(0, 0, 0)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true
    }
  }, [activeCells, radius])

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, MAX_CLUSTERS]}
      frustumCulled={false}
    >
      <dodecahedronGeometry args={[0.032, 0]} />
      <meshStandardMaterial
        roughness={0.4}
        metalness={0.1}
        toneMapped={true}
      />
    </instancedMesh>
  )
}

