# Planetary Disaster System — Technical Documentation

## Overview

In Evolution Sandbox, disasters are not mere cosmetic visual effects or game-over screens. In line with evolutionary biology and macro-paleontology, planetary cataclysms serve as **punctuated evolutionary filters**:
- Triggering mass extinction events that decimate unfit generalists.
- Creating genetic bottlenecks that shatter phenotypic stagnation.
- Opening vacant ecological niches that drive rapid **adaptive radiation** and speciation among survivors.

All disaster simulation logic executes strictly within the **Web Worker**, dynamically computing environmental perturbations that alter planetary biomes, temperature lapse rates, and genetic mutation frequencies.

---

## 1. Disaster Catalog & Simulation Mechanics

| Disaster Type | Duration (Rotations) | Primary Environmental Dynamics | Evolutionary Selective Impact |
|---|---|---|---|
| **Asteroid Impact** (`asteroid_impact`) | ~12 | Immediate kinetic shockwave; atmospheric soot ($dust \le 0.85$); impact winter ($\Delta T \le -18^\circ\text{C}$). | Immediate lethality pulse mitigated only by `radiationResistance`/armor; photosynthetic resource starvation. |
| **Global Glaciation** (`ice_age`) | ~30 | Prolonged deep freeze ($\Delta T \le -28^\circ\text{C}$); polar ice caps expand equator-ward; ocean moisture locks into glaciers. | High mortality for organisms with high `thermalOptimum`; strong selection for cold tolerance and high mobility. |
| **Supervolcanic Eruption** (`volcanic_eruption`) | ~20 | Phase 1: Ash cooling and airborne toxins. Phase 2: Massive $\text{CO}_2$ release causing runaway greenhouse warming ($\Delta T \le +16^\circ\text{C}$). | Extreme thermal whiplash; filters out high-metabolic organisms under resource scarcity. |
| **Milankovitch Climate Shift** (`climate_shift`) | ~25 | Orbital axial wobble producing precessional oscillations in temperature ($\pm 14^\circ\text{C}$) and precipitation. | Destabilizes static ecological niches; drives rapid speciation and spatial migration. |
| **Coronal Radiation Flare** (`solar_flare`) | ~8 | Magnetosphere depression; cosmic ray flux ($rad \times 8$); mutagenic surge ($mut \times 8$). | Lethal radiation burns on unarmored organisms; surviving lineages experience rapid genomic drift and novel trait discovery. |

---

## 2. Environmental Perturbations Pipeline

Every rotation tick in the Web Worker, `DisasterManager.step(rotation)` evaluates active disaster curves and aggregates them into a composite `EnvironmentalPerturbations` vector:

$$\Delta T = \sum \Delta T_d(t)$$
$$\text{RadMult} = 1.0 + \sum (\text{RadMult}_d(t) - 1.0)$$
$$\text{Dust} = \min\left(1.0, \max_d \text{Dust}_d(t)\right)$$
$$\text{MutMult} = 1.0 + \sum (\text{MutMult}_d(t) - 1.0)$$

### Coupling with Biological Systems:
1. **Dynamic Biome Grid**: When $\Delta T \ne 0$, `BiomeGridGenerator` recalculates local temperatures and moisture across all 128 cells. Polar biomes creep towards the equator during Glaciation, or retreat during greenhouse events.
2. **Selective Pulse**: If `instantMortalityRate > 0`, each organism rolls against survival:
   $$P_{\text{kill}} = \text{instantMortalityRate} \cdot (1.0 - 0.75 \cdot \text{radiationResistance})$$
3. **Hyper-Mutation**: During radiation flares, mutation probability in `MutationEngine` scales by $\text{MutMult}$, accelerating genetic innovation.

---

## 3. 3D Visual Shader Coupling

The 3D planet dynamically reflects ongoing cataclysms without heavy textures:
- **Ice Cap Expansion**: In [Planet.tsx](file:///d:/Projects/game1/src/features/planet/components/Planet.tsx), `effectiveIceCapLatitude` scales linearly with $\Delta T$. During an Ice Age, glacial sheets expand from latitude $0.74$ down to $0.20$ ($11^\circ$ from the equator).
- **Atmospheric Discoloration**:
  - Radiation Flares excite atmospheric particles into an **auroral amber glow** (`#f59e0b`).
  - Asteroid Soot and Volcanic Ash darken the atmospheric envelope into a **hazy ochre/gray** (`#78716c`).

---

## 4. UI & Control Architecture

- **Cataclysm Arsenal**: Floating god-power bar located at the top-center. Allows players to manually trigger any disaster with customized severity (50%, 80%, 100%).
- **Active Disaster Banner**: Pulsing alert HUD displaying duration progress, remaining rotations countdown, and realtime readings for $\Delta T$, Dust opacity, Radiation multiplier, and Mutagenic flux.

