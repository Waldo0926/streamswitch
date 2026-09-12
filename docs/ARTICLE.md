# Building a Small Reactive Simulation with RxJS

StreamSwitch started as an experiment in how far a small browser simulation could go with one simple constraint: state transitions should stay easy to reason about even when time, input, randomness, pause, restart, and rendering all interact.

The application is intentionally small: packets move toward a gateway, the player selects one of three routes, and every arrival is either accepted or rejected. That is enough behaviour to make time, input, pause, restart, randomness, rendering, and testing interact without hiding the architecture behind a framework.

## 1. Events are data

A keyboard press, a timer tick, and a generated packet look unrelated in imperative code. In the stream model they become values with the same destination: the reducer.

```ts
merge(tick$, spawn$, routeInput$, pause$)
    .pipe(scan(reduceState, initialState));
```

The value of this pattern is not the short syntax. It is that the system has one state transition boundary. I can inspect, test, replay, or replace the source of any action without changing the reducer.

## 2. Pure state is easier to reason about

The model does not know what the DOM is. It does not know the current wall-clock time. It does not call a random function. It receives a state and an action, and it returns a state.

That makes questions concrete. “What happens if two packets arrive on the same tick?” is not a browser problem; it is one reducer test. “Does the game freeze after lives reach zero?” is another reducer test.

The UI can change completely while the model remains valid.

## 3. Pause is a gate, not a special case everywhere

A common approach to pause is to add `if (paused)` checks to timers, keyboard handlers, animation functions, and spawning logic. That spreads one concern across the whole program.

StreamSwitch instead uses a small operator:

```ts
export const gatedBy =
    <T>(gate$: Observable<boolean>) =>
    (source$: Observable<T>) =>
        source$.pipe(
            withLatestFrom(gate$),
            filter(([, open]) => open),
            map(([value]) => value),
        );
```

Gameplay streams pass through the same gate. Events that occur while closed are discarded rather than queued, so resuming does not release a burst of stale timer events.

The same gate also follows page visibility. If the tab is hidden, the simulation stops advancing instead of relying on browser timer throttling to remain perfectly synchronised.

## 4. Determinism makes randomness testable

Calling `Math.random()` inside a reducer makes the same input capable of producing different outputs. That is convenient, but it destroys replayability.

This project uses a tiny xorshift32 generator. The stream layer turns generated values into ordinary actions. The reducer never sees a random source.

A run can therefore be described as:

```text
seed + user input history
```

That opens the door to replay files, deterministic bug reports, and property testing.

## 5. Rendering belongs at the edge

The renderer keeps a map of packet IDs to SVG nodes. State decides which packets exist and where they are; the renderer decides how that should look.

This means the model does not need an `exit` list or DOM-aware cleanup instructions. If an ID disappears from state, the renderer removes the corresponding node.

It is a slightly more expensive render strategy than pushing view instructions through the model, but the separation is cleaner for a project of this size.

## 6. What I learned

The main lesson from building this is that “functional” does not mean avoiding every object or side effect. A browser application obviously has side effects. The useful question is where they are allowed to happen.

For StreamSwitch:

- randomness is produced in one module;
- browser events are adapted in one module;
- state transitions are pure;
- rendering owns DOM mutation;
- the composition root wires everything together.

That boundary makes the code easier to explain in an interview because every module has a specific reason to exist.

## Next steps

If I continue the project, I would add a replay format, property-based tests, an Observable diagnostics panel, and configurable accessibility settings. Those features would extend the architecture rather than replace it, which is a good sign that the current boundaries are doing useful work.
