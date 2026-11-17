# Evolution Sandbox

Web-based planetary evolution simulator — observe and influence biological evolution on a procedurally generated planet.

## Tech Stack

- **Framework**: React 19 + TypeScript (strict mode)
- **Build**: Vite 8 + pnpm
- **State**: Zustand (UI only) — simulation state lives in Web Worker
- **Styling**: Tailwind CSS 4
- **Testing**: Vitest + React Testing Library

## Getting Started

```bash
pnpm install
pnpm dev       # Start dev server
pnpm test      # Run unit tests
pnpm build     # Production build
pnpm typecheck # TypeScript validation
```

## Architecture Overview

```
Main Thread (React)          Web Worker (Simulation)
┌──────────────────┐         ┌──────────────────────┐
│  DebugPanel      │         │  SimulationClock      │
│  useSimulation   │◄───────►│  (fixed-step ticks)   │
│  (React hook)    │ typed   │                       │
│                  │ messages│                       │
│  WorkerBridge    │─────────│  worker.onmessage     │
│  (rAF loop)     │         │                       │
└──────────────────┘         └──────────────────────┘
```

### Key Principles

1. **Simulation runs in Web Worker** — main thread only renders and handles UI
2. **Fixed-step clock** — deterministic, frame-rate independent
3. **Typed message protocol** — discriminated unions for all Worker communication
4. **Seeded RNG** — reproducible results across sessions

## Project Structure

```
src/
├── features/
│   └── simulation/
│       ├── engine/          # SimulationClock (pure logic, no DOM)
│       ├── workers/         # Web Worker entry point
│       ├── services/        # WorkerBridge (Worker lifecycle)
│       ├── hooks/           # useSimulation (React integration)
│       └── components/      # DebugPanel
├── shared/
│   ├── types/               # Protocol types, domain types
│   └── utils/               # SeededRNG, utilities
├── stores/                  # Zustand stores (UI state only)
└── styles/                  # Global styles
```

## Development Roadmap

- [x] **Phase 1** — Foundation (Simulation Clock, Worker, Protocol)
- [x] **Phase 2** — Planet Rendering (R3F, procedural GLSL shaders, camera controls, atmosphere)
- [x] **Phase 3** — Genesis (10-question questionnaire, deterministic physics engine, planet dossier)
- [x] **Phase 4** — Biological Simulation (genetics, Mendelian inheritance, natural selection, speciation, cohort scaling)
- [x] **Phase 5** — Ecosystem & Biomes (Fibonacci climate grid, spatial dispersal, InstancedMesh biomass rendering)
- [x] **Phase 6** — Planetary Disasters (asteroids, ice ages, supervolcanoes, climate shifts, solar radiation flares)
- [x] **Phase 7** — Persistence (IndexedDB save/load, slot management, schema versioning)
- [x] **Phase 8** — Optimization & Polish (Dynamic biogeochemical cycles, Web Audio procedural SFX, 60Hz worker throttling, 3D shockwave FX, keyboard hotkeys & cinematic camera)

## License

Private project.
