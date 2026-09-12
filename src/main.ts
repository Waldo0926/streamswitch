import "./style.css";
import {
    BehaviorSubject,
    map,
    merge,
    scan,
    startWith,
    switchMap,
    tap,
    type Observable,
} from "rxjs";
import { type Action, type Route } from "./domain";
import { initialState, reduceState } from "./model";
import { render } from "./render";
import {
    activeGate$,
    gatedBy,
    restart$,
    routeButtons$,
    routeKeys$,
    routeStep$,
    spawn$,
    tick$,
} from "./streams";

const required = <T extends Element>(selector: string): T => {
    const element = document.querySelector<T>(selector);
    if (!element) throw new Error(`Missing required element: ${selector}`);
    return element;
};

const packetLayer = required<SVGGElement>("#packet-layer");
const overlayLayer = required<SVGGElement>("#overlay-layer");
const routeControls = required<HTMLElement>("#route-controls");
const score = required<HTMLElement>("#score");
const streak = required<HTMLElement>("#streak");
const lives = required<HTMLElement>("#lives");

const restartSignal$ = restart$(document);
const gate$ = activeGate$(document, restartSignal$);
const selected$ = new BehaviorSubject<Route>(initialState.selectedRoute);

const directRoute$ = merge(routeKeys$(document), routeButtons$(routeControls)).pipe(
    tap(action => {
        if (action.type === "select-route") selected$.next(action.route);
    }),
);

const routeActions$ = merge(directRoute$, routeStep$(document, selected$));
const paused$ = gate$.pipe(
    map(open => ({ type: "set-paused", paused: !open }) as const),
);

const runIndex$ = restartSignal$.pipe(
    scan(run => run + 1, 0),
    startWith(0),
);

runIndex$
    .pipe(
        switchMap(runIndex => {
            selected$.next(initialState.selectedRoute);
            const seed = 0x51f15e + runIndex * 104729;
            const gameplayRoute$ = routeActions$.pipe(gatedBy(gate$));
            const actions$ = merge(
                tick$(gate$),
                spawn$(seed, gate$),
                gameplayRoute$,
                paused$,
            ) as Observable<Action>;

            return actions$.pipe(
                scan(reduceState, initialState),
                startWith(initialState),
            );
        }),
    )
    .subscribe(state =>
        render(state, {
            packetLayer,
            overlayLayer,
            routeControls,
            score,
            streak,
            lives,
        }),
    );
