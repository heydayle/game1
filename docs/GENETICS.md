# Biological Simulation & Genetics Engine — Technical Documentation

## Overview

Phase 4 introduces the **Biological Simulation Engine** for Evolution Sandbox. Operating strictly within the **Web Worker**, the engine implements true population genetics: diploid gene inheritance, Mendelian dominance and recessiveness, environmental natural selection, stochastic mutations, speciation branching, and extinction tracking.

---

## Genetic Architecture

### 1. Diploid Allele Pairs & Dominance

Each gene is diploid, consisting of two homologous alleles:
$$\text{Gene} = [\text{allele}_A, \text{allele}_B]$$

Expression logic in [Gene.ts](file:///d:/Projects/game1/src/features/evolution/genetics/Gene.ts):
- **Dominant vs Recessive**: The dominant allele dictates the expressed value.
- **Homozygous**: If both alleles share dominance, their values are averaged.
- **Codominant**: Traits blend proportionally.

### 2. Functional Loci

| Genetic Locus | Phenotypic Manifestation | Environmental Counterpart |
|---|---|---|
| `thermalOptimum` | Preferred temperature ($-40^\circ\text{C}$ to $+80^\circ\text{C}$) | Planet `surfaceTemperatureCelsius` |
| `thermalRange` | Tolerance buffer ($5^\circ\text{C}$ to $35^\circ\text{C}$) | Seasonal variance & latitude extremes |
| `waterConservation` | Moisture retention & desiccation defense ($0.0 - 1.0$) | Planet `oceanLevel` / aridity |
| `metabolicEfficiency` | Basal energy burned per rotation ($0.4 - 2.8$ units) | Planet geothermal / solar flux |
| `reproductiveInvestment` | $r$ vs $K$ reproductive strategy | Biomass growth & clutch size |
| `structuralArmor` | Resistance to radiation & tectonic stress | Planet `radiationLevel` & tectonics |
| `mobilityFactor` | Foraging radius and dispersal | Resource harvesting bonus |

---

## The Evolutionary Cycle (Per Rotation)

Every completed rotation tick in the Web Worker advances biological life:

```
┌────────────────────────────────────────────────────────┐
│ 1. Aging & Basal Metabolism                            │
│    energy -= phenotype.metabolicRate                   │
│    if energy <= 0 -> Starvation Death                  │
├────────────────────────────────────────────────────────┤
│ 2. Natural Selection Filter                            │
│    fitness = SelectionEngine.evaluateFitness(pheno)   │
│    P_survive = clamp(fitness^pressure, 0.05, 0.98)     │
│    if rng.next() > P_survive -> Environmental Death    │
├────────────────────────────────────────────────────────┤
│ 3. Ambient Foraging & Nutrition                        │
│    energy += 1.8 * resourceAvailability * mobility     │
├────────────────────────────────────────────────────────┤
│ 4. Reproduction & Mendelian Recombination              │
│    Fertile survivors pair up                           │
│    Offspring inherit 1 allele from each parent         │
│    MutationEngine rolls mutations (scaled by radiation)│
├────────────────────────────────────────────────────────┤
│ 5. Speciation Threshold Check                          │
│    if distance(child, ancestor) > 0.22 -> New Species  │
├────────────────────────────────────────────────────────┤
│ 6. Extinction Evaluation                               │
│    if species.livingMembers == 0 -> Mark Extinct       │
└────────────────────────────────────────────────────────┘
```

---

## Speciation & Divergence

Speciation is governed by the **Genetic Distance Metric**:
$$D(G_A, G_B) = \sqrt{\frac{1}{N}\sum_{i=1}^N (v_{A,i} - v_{B,i})^2}$$

When an offspring's genotype diverges by more than $D > 0.22$ from its species' founding ancestor, a new daughter species branch is dynamically registered with its own distinct palette badge and phylogenetic lineage.

---

## Population Dynamics & Carrying Capacity

The simulation enforces no arbitrary ceiling on biological abundance:
```typescript
export const MAX_CARRYING_CAPACITY = Number.POSITIVE_INFINITY
```

Rather than hitting an artificial hardcap, population size is governed organically by **Natural Density-Dependent Ecological Thermodynamics**:
- The planet's star distance, solar irradiance, geothermal core activity, and hydrosphere establish a finite energy flux pool.
- As populations expand, natural competition for energy resources, thermal stress, and environmental attrition dictate survival rates according to Malthusian/logistic ecological principles.
- If environmental conditions are abundant or boosted by the player, populations can expand unconstrained.

---

## Player Interventions ("Tạo hóa")

Via the [EcosystemHUD.tsx](file:///d:/Projects/game1/src/features/evolution/components/EcosystemHUD.tsx) interface, the player can:
1. **Seed Life**: Inoculate a primordial progenitor population adapted to current surface temperature and ocean level.
2. **Radiation Surge**: Trigger a high-energy selective pulse, elevating mutation frequencies and testing the resilience of living lineages.
1. **Seed Life**: Inoculate a primordial progenitor population adapted to current surface temperature and ocean level.
2. **Radiation Surge**: Trigger a high-energy selective pulse, elevating mutation frequencies and testing the resilience of living lineages.

