# Colony Dynamics, Spatial Clustering & Allee Effect — Technical Documentation

## Overview

In biological ecology and population genetics, pioneer populations **never emerge randomly scattered across an entire planet**. If a handful of individuals are dispersed sparsely over isolated regions, they succumb to the **Allee Effect**:
- Inability to find mates.
- Collapse of cooperative foraging and metabolic buffering.
- Rapid extinction before a viable breeding population can establish.

In nature, life begins at a **concentrated biogenesis hotspot** (e.g., an active hydrothermal vent field or a protected volcanic tidal lagoon). Pioneer populations develop as **dense, localized colonies** that grow in carrying capacity and gradually disperse outward into contiguous geographic niches as population pressure builds.

---

## 1. Concentrated Biogenesis Cradle

Rather than distributing the initial 40 pioneer organisms across 20–30 disparate cells, the engine ([PopulationManager.ts](file:///d:/Projects/game1/src/features/evolution/population/PopulationManager.ts)) evaluates the entire planetary sphere to identify the **Single Optimal Cradle Cell**:

$$\text{Cradle Score} = \text{carryingCapacity} \cdot \left(1.0 - \frac{|T_{\text{local}} - 30^\circ\text{C}|}{40^\circ\text{C}}\right) \cdot \text{CoastalWaterBonus}$$

- **Epicenter Cluster**: 
  - $70\%$ of the initial pioneer population is placed directly in the epicenter cradle cell.
  - $30\%$ is placed in its 2 immediately adjacent physical neighbor cells.
- **Visual Impact on 3D Globe**: On biogenesis, the player immediately sees a vibrant, concentrated biomass cluster developing at a specific ecological haven on the planet, rather than microscopic solitary dots lost in the wilderness.

---

## 2. Colony-Based Local Reproduction & The Allee Effect

Instead of pairing mates globally across a flattened array, reproduction is partitioned by local habitat colonies:

1. **Intra-Colony Mating**:
   - Organisms in the same cell mate with local colony partners.
   - Preserves locally adapted gene complexes (temperature tolerance, moisture conservation).
2. **Neighbor Cross-Pollination**:
   - If an organism is odd-one-out in its cell, it attempts cross-border mating with a partner in an immediately contiguous geodesic neighbor cell.
3. **The Allee Penalty for Isolated Organisms**:
   - If an individual is completely stranded in a wilderness cell with no local or neighboring mates:
     - It cannot perform sexual reproduction.
     - Clonal budding or asexual division is only possible if its energy reserves are high ($\ge 7.0$), with a $50\%$ penalty failure rate.
     - Solitary wanderers naturally perish unless they rejoin a colony!

---

## 3. Density-Dependent Geodesic Neighbor Dispersal

Migration is now strictly physical and density-dependent:

1. **Adjacency Graph on Fibonacci Sphere** ([BiomeGridGenerator.ts](file:///d:/Projects/game1/src/features/environment/climate/BiomeGridGenerator.ts)):
   - Precomputes the 5 physically contiguous neighbor cell IDs for each of the 128 cells using 3D Euclidean surface distances.
   - Eliminates non-adjacent index jumps.
2. **Colony Retention vs Overcrowding Pressure**:
   - When local cell density is comfortable ($\text{biomassDensity} \le 0.65$), organisms exhibit **clustering affinity** ($P_{\text{migrate}} = \text{mobility} \cdot 0.05$). They stay together to feed and mate.
   - When the local habitat approaches carrying capacity ($\text{biomassDensity} > 0.65$), population pressure triggers frontier expansion ($P_{\text{migrate}} = 0.05 + \text{mobility} \cdot 0.30$).
3. **Contiguous Territorial Spread**:
   - Expanding organisms spill into contiguous neighbor cells, creating expanding, coherent biological ranges that ripple naturally across continents and ocean basins.

