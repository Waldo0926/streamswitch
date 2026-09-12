# StreamSwitch

**English** · [中文](README.zh-CN.md)

> An RxJS-powered reactive packet-routing game built with immutable state, deterministic simulation, and testable event streams.

StreamSwitch is a small browser project for exploring **functional reactive programming** through an interactive simulation. Incoming packets move toward a gateway, each packet belongs to one of three routes, and the player must select the matching route before the packet arrives.

The interesting part is the architecture: input, timers, pause/resume, visibility changes, spawning, and restart are represented as Observable streams; the simulation itself is a pure state transition; rendering is kept at the edge.

## Why I built it

I wanted a compact project that demonstrates the ideas I found most useful while learning functional programming and RxJS:

- model the application as one immutable state value;
- turn events into a stream of typed actions;
- keep the reducer pure so behaviour is easy to test;
- treat pause as a stream gate rather than a pile of mutable flags;
- use deterministic pseudo-randomness so simulations can be replayed;
- isolate DOM work from state transitions.

This repository was rewritten as an independent portfolio project with a new domain, data model, UI, reducer design, random generator, tests, and documentation.

## Gameplay

Packets enter from the left and carry one of three route markers:

- **A** → Alpha
- **B** → Beta
- **G** → Gamma

Choose the correct route before a packet reaches the gateway. Correct routes increase the score and streak; mistakes consume a life. The stream becomes faster over time.

| Control | Action |
| --- | --- |
| `1` / `2` / `3` | Select Alpha / Beta / Gamma |
| `↑` / `↓` | Cycle through routes |
| Mouse | Click a route button |
| `P` | Pause / resume |
| `R` | Restart with a new deterministic run |

## Architecture

```text
DOM events + timers + visibility
              │
              ▼
        RxJS Observables
              │
              ▼
         typed Actions
              │
              ▼
      scan(reduceState, state)
              │
              ▼
       immutable GameState
              │
              ▼
           render()
              │
              ▼
          SVG + HTML
```

### Pure model

`src/model.ts` contains the reducer and all simulation rules. It does not read the DOM, current time, or random values. Given the same state and action, it always returns the same next state.

Instead of action classes, this project uses a **discriminated union**:

```ts
export type Action =
    | { type: "tick" }
    | { type: "spawn"; route: Route }
    | { type: "select-route"; route: Route }
    | { type: "set-paused"; paused: boolean };
```

That keeps transitions explicit and lets TypeScript check that every action is handled.

### Stream layer

`src/streams.ts` converts browser events and timers into actions. `gatedBy` is a small custom operator used to discard gameplay events while the app is paused or the page is hidden.

Restart is modelled by switching to a fresh state stream. This makes a run a disposable reactive pipeline instead of a mutable object that has to be manually reset field by field.

### Deterministic simulation

`src/random.ts` uses `xorshift32`. Randomness is generated outside the reducer and converted into ordinary `spawn` actions. A run seed therefore fully determines packet types and spawn delays, which makes debugging and testing much easier than calling `Math.random()` inside state logic.

## Project structure

```text
src/
  domain.ts    shared types and configuration
  model.ts     pure state transitions
  random.ts    deterministic pseudo-random generator
  streams.ts   RxJS event/timer pipelines
  render.ts    DOM/SVG rendering only
  main.ts      composition root
  style.css    visual design

tests/
  model.test.ts
  random.test.ts
  streams.test.ts

docs/
  ARTICLE.md
  ARTICLE.zh-CN.md
```

## Run locally

```bash
npm install
npm run dev
```

Build and test:

```bash
npm run build
npm test
```

## What I would extend next

- difficulty presets and accessibility settings;
- replay files generated from seed + input history;
- a small telemetry panel visualising Observable rates;
- property-based tests for reducer invariants;
- mobile touch gestures.

## Technical write-up

See [Building a Small Reactive Simulation with RxJS](docs/ARTICLE.md) or the [Chinese version](docs/ARTICLE.zh-CN.md).

## License

MIT
