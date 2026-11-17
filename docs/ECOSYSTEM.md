# Ecosystem & Biome Distribution — Technical Documentation

## Overview

Phase 5 introduces spatial ecology to Evolution Sandbox. Rather than treating the planet as a single homogeneous petri dish, the planetary surface is partitioned into discrete ecological niches. Living organisms disperse across biomes, adapt to local temperature lapse rates and moisture gradients, and are visually manifested as 3D biomass clusters on the planetary sphere via GPU instancing.

---

## 1. Fibonacci Sphere Climate Grid

To ensure equal-area spatial partitioning on a 3D sphere without polar distortion (which plagues standard latitude-longitude UV grids), the ecosystem uses a **Fibonacci Sphere Lattice** of 128 discrete spatial cells.

### Mathematical Formulation
For $i \in [0, N-1]$ where $N = 128$:
$$\phi = \arccos\left(1 - \frac{2(i + 0.5)}{N}\right)$$
$$\theta = \pi (1 + \sqrt{5}) \cdot i$$
$$\mathbf{P}_i = (\sin\phi \cos\theta, \cos\phi, \sin\phi \sin\theta)$$

- Latitude: $\lambda_i = \arcsin(y_i)$ (in radians, from $-\frac{\pi}{2}$ at the South Pole to $+\frac{\pi}{2}$ at the North Pole).
- Longitude: $\Lambda_i = \text{atan2}(z_i, x_i)$.

### Local Microclimate Derivation
Each cell calculates its environmental state from the global planetary parameters:
1. **Latitudinal Insolation**:
   $$\text{insolation}_i = \max(0, \cos(\lambda_i))$$
2. **Local Temperature Lapse Rate**:
   $$T_i = T_{\text{surface}} + 22^\circ\text{C} \cdot (\text{insolation}_i - 0.5)$$
3. **Moisture Content**:
   $$M_i = \text{oceanLevel} \cdot 0.7 + \text{insolation}_i \cdot 0.3$$
4. **Biome Classification**:
   - `ocean`: if cell elevation or moisture > 0.85 and latitude allows open water.
   - `tundra`: $T_i < -5^\circ\text{C}$.
   - `taiga`: $-5^\circ\text{C} \le T_i < 5^\circ\text{C}$.
   - `rainforest`: $T_i \ge 22^\circ\text{C}$ and $M_i > 0.65$.
   - `desert`: $T_i \ge 20^\circ\text{C}$ and $M_i < 0.35$.
   - `temperate_forest`: $5^\circ\text{C} \le T_i < 22^\circ\text{C}$ and $M_i \ge 0.45$.
   - `grassland`: $5^\circ\text{C} \le T_i < 22^\circ\text{C}$ and $M_i < 0.45$.

---

## 2. Spatial Dispersal & Migration Dynamics

Organisms possess a `mobilityFactor` locus (expressed in Phenotype as $0.0 - 1.0$) which dictates spatial migration behavior:

1. **Local Selection Filter**:
   Organisms are evaluated against their local cell temperature $T_i$ and local moisture, rather than the global planet average.
2. **Dispersal Probability**:
   $$P_{\text{migrate}} = \text{mobilityFactor} \cdot 0.25$$
   If an organism migrates, it identifies its nearest neighboring cells via geodesic dot-product distance and moves toward niches offering higher carrying capacity or lower competition.
3. **Carrying Capacity per Cell**:
   Each cell supports biomass proportional to local temperature suitability and moisture. Population pressure triggers outward dispersal.

---

## 3. High-Performance GPU Rendering (`BiomassClusters`)

### Architecture
- **Single Draw Call**: Rendering thousands of organisms individually would exceed web draw-call budgets. All 128 cells are rendered using a single `THREE.InstancedMesh` with a `DodecahedronGeometry`.
- **Surface Alignment**:
  - Each instance is positioned at planetary radius $R = 2.02$ (just above the terrain shader).
  - Instance orientation is dynamically computed using a quaternion rotation from the unit up vector $(0, 1, 0)$ to the cell normal vector $\mathbf{n}_i$.
- **Scale by Density**:
  $$\text{Scale}_i = \text{clamp}\left(\frac{\text{biomassDensity}_i}{100}, 0, 1\right) \cdot (0.04 + 0.08 \cdot \text{densityFactor})$$
  Cells with 0 biomass are scaled to $(0, 0, 0)$ and frustum-culled on GPU.
- **Lineage Color Coding**:
  Instance colors correspond to the dominant species inhabiting the cell, blending seamlessly with the planet's visual hierarchy.

---

## 4. UI & Inspection Integration

- **Inspect HUD**: Hovering over the planet surface queries the nearest Fibonacci cell and displays local temperature, moisture, and active biome type.
- **Ecosystem HUD**: Features a realtime stacked horizontal bar displaying planetary biome coverage percentages.

