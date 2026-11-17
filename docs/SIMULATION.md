# Simulation Engine — Technical Documentation

## Overview

The Simulation Engine is the heart of Evolution Sandbox. It manages the passage of time in the simulated world using a **fixed-step clock** running inside a **dedicated Web Worker**.

## Time Model

### Rotations

The sole unit of simulation time is the **Rotation** — one complete rotation of the planet around its axis.

```
1 Rotation = ROTATION_DURATION_MS (1000ms of simulation time at 1x speed)
```

### Time Warp

The simulation supports four speed multipliers:

| Speed | Rotations per real second |
|-------|--------------------------|
| 1x    | ~1                       |
| 10x   | ~10                      |
| 100x  | ~100                     |
| 1000x | ~1000                    |

### Fixed-Step Algorithm

```
tick(deltaMs):
  if status != 'running': return 0
  if deltaMs < 0: return 0

  scaledDelta = deltaMs × speed
  accumulated = min(accumulated + scaledDelta, MAX_CAP)

  completedRotations = 0
  while accumulated >= ROTATION_DURATION_MS:
    accumulated -= ROTATION_DURATION_MS
    rotations++
    completedRotations++

  return completedRotations
```

**Why fixed-step?**
- Deterministic: same inputs always produce same outputs
- Frame-rate independent: simulation doesn't slow down with low FPS
- Reproducible: critical for replays and debugging

### Backlog Cap

To prevent **spiral-of-death** (where a lag spike produces so many ticks that the simulation can never catch up), the accumulated delta is capped at `MAX_ACCUMULATED_DELTA_MS × speed`.

At 1x speed, this means at most 5 seconds of simulation can accumulate. At 1000x, the cap is 5000 seconds of simulation time.

## Worker Communication Protocol

### Architecture

```
┌─────────────────┐     SimulationCommand      ┌─────────────────┐
│                 │ ──────────────────────────► │                 │
│   Main Thread   │                             │   Web Worker    │
│   (React/UI)    │ ◄────────────────────────── │   (Simulation)  │
│                 │     SimulationResponse       │                 │
└─────────────────┘                             └─────────────────┘
```

### Commands (Main → Worker)

| Command     | Fields          | Effect                          |
|-------------|-----------------|---------------------------------|
| `start`     | —               | Transitions to `running`        |
| `pause`     | —               | Transitions to `paused`         |
| `reset`     | —               | Resets all state to initial      |
| `set-speed` | `speed: 1\|10\|100\|1000` | Changes time warp speed |
| `tick`      | `deltaMs: number` | Advances simulation clock      |

### Responses (Worker → Main)

| Response   | Fields                     | When                        |
|------------|----------------------------|-----------------------------|
| `ready`    | —                          | Worker initialization done  |
| `snapshot`  | `snapshot: SimulationSnapshot` | After every command      |
| `error`    | `message, code`            | On any error                |

### SimulationSnapshot

```typescript
interface SimulationSnapshot {
  rotations: number        // Completed rotations
  partialRotation: number  // Progress to next [0, 1)
  status: SimulationStatus // 'idle' | 'running' | 'paused'
  speed: TimeWarpSpeed     // 1 | 10 | 100 | 1000
  wallClockTime: number    // Date.now() at creation
  version: number          // Schema version
}
```

## Component Roles

### SimulationClock
Pure logic class. No DOM, no React, no Three.js. Can be instantiated and tested independently.

### simulation.worker.ts
Web Worker entry point. Creates a `SimulationClock`, listens for commands, sends responses.

### SimulationWorkerBridge
Main-thread service. Manages Worker lifecycle, drives `requestAnimationFrame` loop, and broadcasts snapshots to subscribers.

### useSimulation (React Hook)
Connects React components to the bridge. Provides snapshot state and command callbacks. Uses a singleton bridge pattern with reference counting.

## Seeded RNG

Mulberry32 algorithm — fast, deterministic, 32-bit PRNG.

```typescript
const rng = new SeededRNG(42)
rng.next()          // [0, 1)
rng.nextInt(1, 6)   // [1, 6]
rng.nextFloat(0, 1) // [0, 1)
```

State can be saved (`getState()`) and restored (`setState()`) for serialization.

## Testing Strategy

Tests live in `__test__/` directories adjacent to the modules they test.

Current coverage:
- `SimulationClock`: 22 tests (lifecycle, ticks, time warp, backlog)
- `SeededRNG`: 7 tests (determinism, range, distribution, save/restore)
- `SimulationProtocol`: 6 tests (constants, type discrimination)

