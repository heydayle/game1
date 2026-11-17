# Planetary 3D Rendering — Technical Documentation

## Overview

Phase 2 introduces the 3D visual layer for Evolution Sandbox, built using **Three.js**, **React Three Fiber (R3F)**, **Drei**, and custom **GLSL Shaders**.

In line with the project's **Abstract Minimalism** art direction and **Zero-Image-Texture** principle, all continental landmasses, bathymetry, mountain ranges, and polar ice caps are procedurally evaluated on the GPU.

---

## Architectural Separation

```
┌────────────────────────────────────────────────────────┐
│ Main Thread (React + WebGL)                            │
│                                                        │
│  SceneCanvas (R3F Canvas, Lights, Camera, Stars)       │
│   └── Planet (Axial tilt 23.44°, dynamic spin)         │
│        ├── PlanetSurface (Procedural GLSL Shader)      │
│        └── PlanetAtmosphere (Fresnel scattering glow) │
│                                                        │
│  PlanetInspectHUD (Real-time coordinate / biome query) │
│  DebugPanel (Simulation controls & speed warp)         │
└──────────────────────────┬─────────────────────────────┘
                           │ (Snapshot state stream)
┌──────────────────────────▼─────────────────────────────┐
│ Web Worker (Simulation Layer)                         │
│  SimulationClock (Rotations, Fixed-step Ticks)         │
└────────────────────────────────────────────────────────┘
```

- **Simulation Engine** does not know or care about Three.js or WebGL.
- **Rendering Layer** observes the simulation snapshot (`rotations` + `partialRotation`) to smoothly rotate the planet around its tilted axis. 1 complete rotation = 360° spin.

---

## Procedural Shader Architecture

Shaders are located in `src/features/planet/shaders/` and imported as raw strings:

### 1. `planet.vert.glsl`
- Transforms vertices and calculates world normal vectors.
- Emits `vPosition` (local object-space coordinates on unit sphere). Because noise is sampled using local coordinates, the continental geography rotates naturally with the sphere.

### 2. `planet.frag.glsl`
- **3D Simplex Noise + Fractal Brownian Motion (5 octaves)** with domain warping to generate natural tectonic boundaries, gulfs, and mountain ridges.
- **Earth-tone Color Palette**:
  - Abyssal Ocean (`#091e39`)
  - Continental Shelf / Shallow Water (`#164763`)
  - Coastline / Beach (`#b9a77f`)
  - Lowland Plains (`#3a633e`)
  - Highland Forests (`#26472d`)
  - Mountain Ridges (`#5a524b`)
  - Mountain Snow (`#d1dbe1`)
  - Polar Ice Caps (`#e0eaf0`)
- **Specular Ocean Reflection**: Ocean surfaces reflect the directional sun light with Blinn-Phong specular highlights; continental land surfaces remain matte.
- **Atmospheric Horizon Softening**: Half-lambert terminator gives a cinematic planetary curve.

### 3. `atmosphere.frag.glsl` & `atmosphere.vert.glsl`
- Concentric spherical shell with radius $1.15 \times r$.
- Additive blending (`THREE.AdditiveBlending`, `depthWrite: false`).
- Computes a Fresnel rim glow $\text{pow}(1 - \mathbf{N}\cdot\mathbf{V}, 3.2)$ biased towards the sun-facing limb.

---

## Interactive Surface Inspection

Moving the cursor across the planet sphere queries the intersection point in local sphere coordinates via `PlanetSurface.tsx`:
- Calculates exact Latitude and Longitude using `cartesianToLatLong`.
- Classifies the biome under the pointer (`classifyBiome`).
- Updates `PlanetInspectHUD` in real time with coordinates, elevation zone, and biome descriptions.

