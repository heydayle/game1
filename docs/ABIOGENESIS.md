# Prebiotic Chemistry & Abiogenesis Engine — Technical Documentation

## Overview

In physical sciences and evolutionary biology, living organisms do not spontaneously materialize from nothingness at $t=0$. Instead, life is the natural emergent culmination of **prebiotic chemical evolution**:
$$\text{Planetary Elements} \xrightarrow{\text{Energy Catalysts}} \text{Organic Precursor Soup} \xrightarrow{\text{Self-Assembly}} \text{Protocells (LUCA)} \xrightarrow{\text{Abiogenesis}} \text{Biological Evolution}$$

When a new world is created via the Genesis Protocol, Evolution Sandbox initializes the planet in a sterile **Prebiotic Chemical Era** (`stage: 'prebiotic'`). Life emerges organically only when the physical elements, solvent presence, and energy fluxes achieve chemical fertility.

---

## 1. Chemical Fertility & Synthesis Model

The engine ([PrebioticEngine.ts](file:///d:/Projects/game1/src/features/evolution/abiogenesis/PrebioticEngine.ts)) evaluates four fundamental biochemical prerequisites each rotation:

### 1. Liquid Water Solvent Viability ($S_v$)
Liquid water is the universal solvent for prebiotic phosphorylation and peptide synthesis.
- Thermal Window:
  $$f(T) = \begin{cases} 
  1.0 & 20^\circ\text{C} \le T \le 55^\circ\text{C} \\
  \max(0.1, T / 20) & 0^\circ\text{C} \le T < 20^\circ\text{C} \\
  \max(0.1, (85 - T) / 30) & 55^\circ\text{C} < T \le 85^\circ\text{C} \\
  \min(0.6, \text{geothermal} / 100) & T < 0^\circ\text{C} \text{ (Sub-glacial hydrothermal vents)} \\
  0.0 & \text{otherwise}
  \end{cases}$$
- Solvent Viability:
  $$S_v = \text{clamp}\left(\frac{\text{oceanLevel}}{0.4}, 0, 1\right) \cdot f(T)$$

### 2. Organic Building Blocks ($O_b$)
Evaluates raw carbonaceous material, atmospheric nitrogen for nucleic acids, and reducing carbon sources ($\text{CH}_4, \text{CO}_2$):
$$O_b = \frac{\text{carbonOrganics}}{18.0} \cdot 0.45 + \frac{\text{nitrogen}}{80.0} \cdot 0.25 + \frac{\text{methane}}{15.0} \cdot 0.15 + \frac{\text{carbonDioxide}}{20.0} \cdot 0.15$$

### 3. Catalytic Energy Flux ($E_c$)
Thermal and radiation energy driving molecular collisions and polymerization:
$$E_c = \frac{\text{geothermalEnergy}}{100} \cdot 0.45 + \min\left(1.0, \frac{\text{solarWatts}}{1400}\right) \cdot 0.30 + \frac{\text{mineralRichness}}{100} \cdot 0.25$$

### 4. Synthesis Progression
$$\text{Chemical Fertility} = S_v \cdot 0.45 + O_b \cdot 0.35 + E_c \cdot 0.20$$
$$\Delta \text{Complexity} = \text{Fertility} \times 0.05 \quad (\text{per rotation tick in Web Worker})$$

---

## 2. Chemical Lineage Archetypes & Biogenesis

When `organicComplexity >= 1.0` (or when the player sparks biogenesis once minimum threshold $\ge 25\%$ is reached), the progenitor species (LUCA) is synthesized with a genome directly matching the planet's chemistry:

| Planetary Chemical Signature | Archetype Name | Dominant Primordial Traits |
|---|---|---|
| High geothermal energy ($>60\%$) & atmospheric methane | **Chemoarchaeon Primus** | Hyperthermophilic ($\text{optimum} \ge 50^\circ\text{C}$), anaerobic, sulfur-reducing metabolism. |
| High solar irradiance ($>1150\,\text{W/m}^2$) & abundant water | **Protocyanophyta Sol** | Phototrophic, moderate desiccation tolerance, tidal lagoon niche. |
| Dense carbon organics ($>18\%$) & high primordial biomass | **Coacervata Organica** | Heterotrophic, nutrient-absorbing protocell membranes. |
| Extreme cosmic radiation flux | **Radiodurans Extremis** | Radiation-hardened, elevated structural armor, DNA repair mechanisms. |

---

## 3. UI Presentation

- **Prebiotic Chemical Soup HUD**: When in `prebiotic` state, the monitor displays:
  - Realtime chemical meters for Solvent ($\text{H}_2\text{O}$), Organics ($\text{C}, \text{N}$), and Catalyst Energy.
  - Prebiotic Synthesis Progress bar $[0\% \to 100\%]$.
  - Predicted chemical lineage archetype and reaction description.
  - Interactive **⚡ Spark Biogenesis** button.
- **Seamless Biological Transition**: Once biogenesis occurs, the monitor transitions to active living population tracking.

