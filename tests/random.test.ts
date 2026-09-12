import { describe, expect, it } from "vitest";
import { intBetween, nextSeed, unitFloat } from "../src/random";

describe("deterministic randomness", () => {
    it("replays the same sequence from the same seed", () => {
        const collect = (seed: number) => {
            const values: number[] = [];
            let current = seed;
            for (let i = 0; i < 6; i += 1) {
                current = nextSeed(current);
                values.push(current);
            }
            return values;
        };
        expect(collect(12345)).toEqual(collect(12345));
        expect(collect(12345)).not.toEqual(collect(54321));
    });

    it("maps generated values into requested ranges", () => {
        expect(unitFloat(99)).toBeGreaterThanOrEqual(0);
        expect(unitFloat(99)).toBeLessThanOrEqual(1);
        expect(intBetween(0, 3, 99)).toBeGreaterThanOrEqual(0);
        expect(intBetween(0, 3, 99)).toBeLessThan(3);
    });
});
