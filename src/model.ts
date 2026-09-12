import { CONFIG, type Action, type GameState, type Packet, type Route } from "./domain";

export const initialState: GameState = {
    packets: [],
    selectedRoute: 1,
    score: 0,
    streak: 0,
    lives: CONFIG.startingLives,
    elapsedTicks: 0,
    nextPacketId: 1,
    paused: false,
    gameOver: false,
};

export const speedFor = (state: GameState): number =>
    CONFIG.baseSpeed * (1 + state.elapsedTicks / CONFIG.speedRampTicks);

const advance = (packet: Packet, dx: number): Packet => ({
    ...packet,
    x: packet.x + dx,
});

const settleArrivals = (state: GameState, moved: ReadonlyArray<Packet>): GameState => {
    const arrived = moved.filter(packet => packet.x >= CONFIG.gatewayX);
    if (arrived.length === 0) {
        return { ...state, packets: moved, elapsedTicks: state.elapsedTicks + 1 };
    }

    const remaining = moved.filter(packet => packet.x < CONFIG.gatewayX);
    const result = arrived.reduce(
        (acc, packet) => {
            if (packet.route === state.selectedRoute) {
                const nextStreak = acc.streak + 1;
                return {
                    score: acc.score + 100 + Math.min(nextStreak, 10) * 10,
                    streak: nextStreak,
                    lives: acc.lives,
                };
            }

            return {
                score: acc.score,
                streak: 0,
                lives: Math.max(0, acc.lives - 1),
            };
        },
        { score: state.score, streak: state.streak, lives: state.lives },
    );

    return {
        ...state,
        packets: remaining,
        elapsedTicks: state.elapsedTicks + 1,
        score: result.score,
        streak: result.streak,
        lives: result.lives,
        gameOver: result.lives === 0,
    };
};

export const reduceState = (state: GameState, action: Action): GameState => {
    if (action.type === "set-paused") {
        return state.gameOver ? state : { ...state, paused: action.paused };
    }

    if (state.gameOver) return state;

    switch (action.type) {
        case "tick": {
            const moved = state.packets.map(packet => advance(packet, speedFor(state)));
            return settleArrivals(state, moved);
        }
        case "spawn":
            return {
                ...state,
                packets: [
                    ...state.packets,
                    { id: state.nextPacketId, route: action.route, x: CONFIG.spawnX },
                ],
                nextPacketId: state.nextPacketId + 1,
            };
        case "select-route":
            return { ...state, selectedRoute: action.route };
    }
};

export const clampRoute = (value: number): Route =>
    Math.max(0, Math.min(2, value)) as Route;
