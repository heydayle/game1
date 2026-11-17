import { type ReactNode, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'

interface SceneCanvasProps {
  children: ReactNode
  sunPosition?: [number, number, number]
  isCinematic?: boolean
}

export function SceneCanvas({
  children,
  sunPosition = [6, 3, 5],
  isCinematic = false,
}: SceneCanvasProps) {
  return (
    <div className="absolute inset-0 h-full w-full bg-radial from-slate-950 via-gray-950 to-black">
      <Canvas
        camera={{ position: [0, 0, 4.8], fov: 45 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
      >
        <Suspense fallback={null}>
          {/* Deep space starfield */}
          <Stars
            radius={100}
            depth={50}
            count={4000}
            factor={4}
            saturation={0}
            fade
            speed={0.5}
          />

          {/* Sunlight source */}
          <directionalLight
            position={sunPosition}
            intensity={2.2}
            color="#fff8ed"
          />

          {/* Faint cosmic ambient fill */}
          <ambientLight intensity={0.15} color="#1e293b" />

          {/* Main interactive content */}
          {children}

          {/* Planetary Camera Controls */}
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            minDistance={2.2}
            maxDistance={10}
            rotateSpeed={0.8}
            zoomSpeed={0.8}
            dampingFactor={0.05}
            enableDamping={true}
            autoRotate={isCinematic}
            autoRotateSpeed={0.6}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
