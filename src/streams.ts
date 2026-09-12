import {
    BehaviorSubject,
    combineLatest,
    distinctUntilChanged,
    expand,
    filter,
    fromEvent,
    interval,
    map,
    merge,
    scan,
    shareReplay,
    startWith,
    timer,
    withLatestFrom,
    type Observable,
} from "rxjs";

import { CONFIG, type Action, type Route } from "./domain";
import { intBetween, nextSeed, unitFloat } from "./random";

export const gatedBy =
    <T>(gate$: Observable<boolean>) =>
    (source$: Observable<T>): Observable<T> =>
        source$.pipe(
            withLatestFrom(gate$),
            filter(([, open]) => open),
            map(([value]) => value),
        );

const keydown$ = (doc: Document): Observable<KeyboardEvent> =>
    fromEvent<KeyboardEvent>(doc, "keydown").pipe(filter(event => !event.repeat));

export const routeKeys$ = (doc: Document): Observable<Action> => {
    const key$ = keydown$(doc);
    return merge(
        key$.pipe(filter(event => event.code === "Digit1"), map(() => ({ type: "select-route", route: 0 } as const))),
        key$.pipe(filter(event => event.code === "Digit2"), map(() => ({ type: "select-route", route: 1 } as const))),
        key$.pipe(filter(event => event.code === "Digit3"), map(() => ({ type: "select-route", route: 2 } as const))),
    );
};

export const routeButtons$ = (container: HTMLElement): Observable<Action> =>
    fromEvent<MouseEvent>(container, "click").pipe(
        map(event => (event.target as Element).closest<HTMLButtonElement>("button[data-route]")),
        filter((button): button is HTMLButtonElement => button !== null),
        map(button => Number(button.dataset.route) as Route),
        filter((route): route is Route => route === 0 || route === 1 || route === 2),
        map(route => ({ type: "select-route", route }) as const),
    );

export const routeStep$ = (doc: Document, selected$: BehaviorSubject<Route>): Observable<Action> =>
    keydown$(doc).pipe(
        filter(event => event.code === "ArrowUp" || event.code === "ArrowDown"),
        map(event => {
            const delta = event.code === "ArrowUp" ? -1 : 1;
            const next = ((selected$.value + delta + 3) % 3) as Route;
            selected$.next(next);
            return { type: "select-route", route: next } as const;
        }),
    );

export const pauseToggle$ = (doc: Document): Observable<"toggle"> =>
    keydown$(doc).pipe(
        filter(event => event.code === "KeyP"),
        map(() => "toggle" as const),
    );

export const restart$ = (doc: Document): Observable<void> =>
    keydown$(doc).pipe(
        filter(event => event.code === "KeyR"),
        map(() => undefined),
    );

export const activeGate$ = (doc: Document, restartSignal$: Observable<void>): Observable<boolean> => {
    const manual$ = merge(
        pauseToggle$(doc),
        restartSignal$.pipe(map(() => "reset" as const)),
    ).pipe(
        scan((open: boolean, event) => (event === "reset" ? true : !open), true),
        startWith(true),
    );

    const visible$ = fromEvent(doc, "visibilitychange").pipe(
        map(() => !doc.hidden),
        startWith(!doc.hidden),
    );

    return combineLatest([manual$, visible$]).pipe(
        map(([manual, visible]) => manual && visible),
        distinctUntilChanged(),
        shareReplay({ bufferSize: 1, refCount: true }),
    );
};

export const tick$ = (gate$: Observable<boolean>): Observable<Action> =>
    interval(CONFIG.tickMs).pipe(
        gatedBy(gate$),
        map(() => ({ type: "tick" }) as const),
    );

type SpawnPlan = Readonly<{ seed: number; route: Route; delay: number }>;

const planFrom = (seed: number): SpawnPlan => {
    const routeSeed = nextSeed(seed);
    const delaySeed = nextSeed(routeSeed);
    return {
        seed: delaySeed,
        route: intBetween(0, 3, routeSeed) as Route,
        delay: CONFIG.minSpawnMs + unitFloat(delaySeed) * (CONFIG.maxSpawnMs - CONFIG.minSpawnMs),
    };
};

export const spawn$ = (seed: number, gate$: Observable<boolean>): Observable<Action> => {
    const first = planFrom(seed);
    return timer(first.delay).pipe(
        map(() => first),
        expand(previous => {
            const next = planFrom(previous.seed);
            return timer(next.delay).pipe(map(() => next));
        }),
        gatedBy(gate$),
        map(plan => ({ type: "spawn", route: plan.route }) as const),
    );
};
