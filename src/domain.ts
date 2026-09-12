export const ROUTES = ["Alpha", "Beta", "Gamma"] as const;
export type Route = 0 | 1 | 2;

export type Packet = Readonly<{
    id: number;
    route: Route;
    x: number;
}>;

export type GameState = Readonly<{
    packets: ReadonlyArray<Packet>;
    selectedRoute: Route;
    score: number;
    streak: number;
    lives: number;
    elapsedTicks: number;
    nextPacketId: number;
    paused: boolean;
    gameOver: boolean;
}>;

export type Action =
    | Readonly<{ type: "tick" }>
    | Readonly<{ type: "spawn"; route: Route }>
    | Readonly<{ type: "select-route"; route: Route }>
    | Readonly<{ type: "set-paused"; paused: boolean }>;

export const CONFIG = {
    width: 760,
    height: 460,
    spawnX: 70,
    gatewayX: 620,
    baseSpeed: 2.05,
    speedRampTicks: 2100,
    tickMs: 16,
    minSpawnMs: 850,
    maxSpawnMs: 2100,
    startingLives: 3,
} as const;
