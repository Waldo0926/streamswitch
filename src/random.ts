/** A tiny deterministic xorshift32 generator. */
export const nextSeed = (seed: number): number => {
    let x = seed | 0;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return x >>> 0;
};

export const unitFloat = (seed: number): number => nextSeed(seed) / 0xffffffff;

export const intBetween = (min: number, maxExclusive: number, seed: number): number =>
    min + Math.floor(unitFloat(seed) * (maxExclusive - min));
