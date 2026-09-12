import { describe, expect, it, vi } from "vitest";
import { BehaviorSubject, Subject } from "rxjs";
import { gatedBy } from "../src/streams";

describe("gatedBy", () => {
    it("drops source events while closed and resumes without buffering", () => {
        const gate$ = new BehaviorSubject(true);
        const source$ = new Subject<number>();
        const seen: number[] = [];
        source$.pipe(gatedBy(gate$)).subscribe(value => seen.push(value));

        source$.next(1);
        gate$.next(false);
        source$.next(2);
        source$.next(3);
        gate$.next(true);
        source$.next(4);

        expect(seen).toEqual([1, 4]);
    });

    it("does not require timers or DOM to test the pause primitive", () => {
        const gate$ = new BehaviorSubject(false);
        const source$ = new Subject<string>();
        const listener = vi.fn();
        source$.pipe(gatedBy(gate$)).subscribe(listener);
        source$.next("hidden");
        expect(listener).not.toHaveBeenCalled();
    });
});
