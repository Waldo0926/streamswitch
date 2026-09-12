import { describe, expect, it } from "vitest";
import { CONFIG } from "../src/domain";
import { initialState, reduceState, speedFor } from "../src/model";

const tickUntilArrival = (state = initialState) => {
    let current = state;
    for (let i = 0; i < 1000 && current.packets.length > 0; i += 1) {
        current = reduceState(current, { type: "tick" });
    }
    return current;
};

describe("state reducer", () => {
    it("selects a route without mutating the previous state", () => {
        const next = reduceState(initialState, { type: "select-route", route: 2 });
        expect(initialState.selectedRoute).toBe(1);
        expect(next.selectedRoute).toBe(2);
        expect(next).not.toBe(initialState);
    });

    it("scores a correctly routed packet and builds a streak", () => {
        const selected = reduceState(initialState, { type: "select-route", route: 0 });
        const spawned = reduceState(selected, { type: "spawn", route: 0 });
        const settled = tickUntilArrival(spawned);
        expect(settled.score).toBeGreaterThan(100);
        expect(settled.streak).toBe(1);
        expect(settled.lives).toBe(CONFIG.startingLives);
        expect(settled.packets).toHaveLength(0);
    });

    it("loses a life on a wrong route and freezes once lives reach zero", () => {
        let state = initialState;
        for (let i = 0; i < CONFIG.startingLives; i += 1) {
            state = reduceState(state, { type: "spawn", route: 0 });
            state = tickUntilArrival(state);
        }
        expect(state.lives).toBe(0);
        expect(state.gameOver).toBe(true);
        expect(reduceState(state, { type: "select-route", route: 0 })).toBe(state);
    });

    it("ramps speed as simulated time increases", () => {
        const later = { ...initialState, elapsedTicks: CONFIG.speedRampTicks };
        expect(speedFor(later)).toBeCloseTo(CONFIG.baseSpeed * 2);
    });
});
