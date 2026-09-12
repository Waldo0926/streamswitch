import { ROUTES, type GameState, type Packet, type Route } from "./domain";

const NS = "http://www.w3.org/2000/svg";
const routeMeta = [
    { label: "A", y: 132, className: "packet-alpha" },
    { label: "B", y: 230, className: "packet-beta" },
    { label: "G", y: 328, className: "packet-gamma" },
] as const;

const packetNodes = new Map<number, SVGGElement>();

const makePacket = (packet: Packet): SVGGElement => {
    const meta = routeMeta[packet.route];
    const group = document.createElementNS(NS, "g");
    group.classList.add("packet", meta.className);
    group.dataset.id = String(packet.id);

    const body = document.createElementNS(NS, "rect");
    body.setAttribute("x", "-25");
    body.setAttribute("y", "-15");
    body.setAttribute("width", "50");
    body.setAttribute("height", "30");
    body.setAttribute("rx", "9");

    const text = document.createElementNS(NS, "text");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "central");
    text.textContent = meta.label;

    group.append(body, text);
    return group;
};

const updatePacket = (node: SVGGElement, packet: Packet): void => {
    const progress = Math.min(1, Math.max(0, (packet.x - 70) / 550));
    const targetY = routeMeta[packet.route].y;
    const y = progress < 0.82 ? 230 : 230 + (targetY - 230) * ((progress - 0.82) / 0.18);
    node.setAttribute("transform", `translate(${packet.x} ${y})`);
};

const renderPackets = (layer: SVGGElement, state: GameState): void => {
    const live = new Set(state.packets.map(packet => packet.id));

    for (const [id, node] of packetNodes) {
        if (!live.has(id)) {
            node.remove();
            packetNodes.delete(id);
        }
    }

    for (const packet of state.packets) {
        let node = packetNodes.get(packet.id);
        if (!node) {
            node = makePacket(packet);
            packetNodes.set(packet.id, node);
            layer.append(node);
        }
        updatePacket(node, packet);
    }
};

const renderOverlay = (layer: SVGGElement, state: GameState): void => {
    layer.replaceChildren();
    if (!state.paused && !state.gameOver) return;

    const box = document.createElementNS(NS, "rect");
    box.setAttribute("x", "222");
    box.setAttribute("y", "176");
    box.setAttribute("width", "316");
    box.setAttribute("height", "108");
    box.setAttribute("rx", "22");
    box.classList.add("overlay-box");

    const heading = document.createElementNS(NS, "text");
    heading.setAttribute("x", "380");
    heading.setAttribute("y", "220");
    heading.setAttribute("text-anchor", "middle");
    heading.classList.add("overlay-title");
    heading.textContent = state.gameOver ? "Connection dropped" : "Paused";

    const hint = document.createElementNS(NS, "text");
    hint.setAttribute("x", "380");
    hint.setAttribute("y", "251");
    hint.setAttribute("text-anchor", "middle");
    hint.classList.add("overlay-hint");
    hint.textContent = state.gameOver ? "Press R to start a new stream" : "Press P to resume";

    layer.append(box, heading, hint);
};

const setRouteSelection = (container: HTMLElement, selected: Route): void => {
    for (const button of container.querySelectorAll<HTMLButtonElement>("button[data-route]")) {
        const isSelected = Number(button.dataset.route) === selected;
        button.classList.toggle("selected", isSelected);
        button.setAttribute("aria-pressed", String(isSelected));
    }
};

export const render = (
    state: GameState,
    refs: Readonly<{
        packetLayer: SVGGElement;
        overlayLayer: SVGGElement;
        routeControls: HTMLElement;
        score: HTMLElement;
        streak: HTMLElement;
        lives: HTMLElement;
    }>,
): void => {
    renderPackets(refs.packetLayer, state);
    renderOverlay(refs.overlayLayer, state);
    setRouteSelection(refs.routeControls, state.selectedRoute);
    refs.score.textContent = String(state.score);
    refs.streak.textContent = String(state.streak);
    refs.lives.textContent = "●".repeat(state.lives) || "0";
    refs.routeControls.setAttribute("aria-label", `Route selector. ${ROUTES[state.selectedRoute]} selected.`);
};
