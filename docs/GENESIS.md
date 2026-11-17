# Genesis System — Technical Documentation

## Overview

The **Genesis System** establishes the cosmic origin of the simulated planet. Rather than exposing raw sliders or purely random numbers, the system begins with an evocative **10-question questionnaire** probing the player's philosophy, temperament, and creative vision as the cosmic architect ("Tạo hóa").

A deterministic mapping engine ([GenesisEngine.ts](file:///d:/Projects/game1/src/features/genesis/services/GenesisEngine.ts)) processes these choices using physical planetary science formulas and a **Seeded PRNG (Mulberry32)** to generate a complete, coherent `PlanetConfig`.

---

## The 10 Questions Schema

Each question belongs to a distinct planetary formation domain:

1. **The Primordial Spark** (Planetary Core): Geothermal heat, mantle convection, magnetic dynamo.
2. **Stellar Sanctuary** (Orbital Distance): Proximity to parent star (0.72 - 1.75 AU), solar irradiance.
3. **The Hydrosphere** (Water Distribution): Pelagic waterworld (75%), balanced (50%), or arid basin (28%).
4. **The Breath of the World** (Atmosphere): Nitrogen-shielded (1 atm), greenhouse haze (1.8 atm), or primordial methane mist (1.4 atm).
5. **The Dance of Seasons** (Axial Tilt): Perpendicular (4°), Earth-like (23.5°), or wild incline (38°).
6. **Diurnal Rhythm** (Rotation Period): Rapid 14h days, standard 24h, or languid 48h days.
7. **The Mineral Skeleton** (Lithosphere): Basaltic metalliferous, carbonaceous clay, or granite craton.
8. **The Cradle of Genesis** (Biogenesis Zone): Deep hydrothermal vents, tidal lagoons, or cometary seeding.
9. **Nature’s Crucible** (Environmental Pressure): Benevolent sanctuary, dynamic cycles, or harsh Spartan gauntlet.
10. **The Evolutionary Horizon** (Genetic Destiny): Steadfast fidelity, hyper-adaptive speciation, or communal symbiosis.

---

## Physical Constraints & Derivations

### 1. Solar Irradiance
$$S = \frac{1361}{D^2} \, \text{W/m}^2$$
where $D$ is the star distance in AU.

### 2. Equilibrium & Surface Temperature
Planetary Albedo $a$ is approximated from ocean coverage $w$:
$$a \approx 0.1 \times w + 0.3 \times (1 - w) + 0.05$$

Blackbody Equilibrium Temperature:
$$T_{eq} = \left(\frac{S \times (1 - a)}{4 \times \sigma}\right)^{0.25}$$

Greenhouse Effect $\Delta T_{gh}$:
$$\Delta T_{gh} = 33\text{K} \times (P_{atm})^{0.3} \times (1.0 + 3.0 \times r_{CO_2} + 8.0 \times r_{CH_4} + \text{bonus})$$

Surface Temperature:
$$T_{surface} = \text{clamp}(T_{eq} + \Delta T_{gh}, 205\text{K}, 355\text{K})$$

### 3. Polar Ice Cap Extent
Directly tied to surface temperature:
- $T < -20^\circ\text{C}$: Snowball planet ($\text{lat} = 0.38$, covers 62% of planet).
- $T \in [-20, 0]^\circ\text{C}$: Extensive continental ice ($\text{lat} = 0.55$).
- $T \in [0, 22]^\circ\text{C}$: Temperate polar ice caps ($\text{lat} = 0.70 - 0.80$).
- $T > 40^\circ\text{C}$: Hyperthermic ice-free world ($\text{lat} = 0.98$).

### 4. Ocean Level in Shader
$$\text{oceanLevel} = 0.28 + \text{waterAbundance} \times 0.42 \in [0.35, 0.70]$$

---

## Determinism & Seeded Replay

If no explicit seed is passed, `hashAnswers()` computes a 32-bit FNV-1a hash from the selected choices. The same questionnaire answers will always generate the exact same planet name, continental landmasses, surface temperature, and atmospheric makeup.

