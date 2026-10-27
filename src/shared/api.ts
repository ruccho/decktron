import { PaneData } from "./common";

export type PaneCommand =
    | { type: "refresh" }
    | { type: "back" }
    | { type: "forward" }
    | { type: "close" }
    | { type: "set-view-enabled", enabled: boolean }
    | { type: "navigate", path: string }
    | { type: "move", shift: number };

export type Size = { width: number, height: number };
export type Point = { x: number, y: number };

// Messages sent from the host renderer to the main process.
export type HostToMainChannels = {
    "request-panes": [];
    "pane-command": [paneId: string, command: PaneCommand];
    "container-size": [size: Size];
    "container-offset": [offset: Point];
};

// Messages sent from the main process to the host renderer.
export type MainToHostChannels = {
    "panes": [panes: PaneData[]];
    "wheel-horizontal": [delta: number];
};

// API exposed to the host renderer through contextBridge as `window.decktron`.
export type DecktronApi = {
    send: <K extends keyof HostToMainChannels>(channel: K, ...args: HostToMainChannels[K]) => void;
    // Returns a function that removes the listener.
    on: <K extends keyof MainToHostChannels>(channel: K, listener: (...args: MainToHostChannels[K]) => void) => () => void;
};
