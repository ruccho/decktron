import { LayoutData } from "./common";

export type PaneCommand =
    | { type: "refresh" }
    | { type: "back" }
    | { type: "forward" }
    | { type: "close" }
    | { type: "navigate", path: string }
    | { type: "move", shift: number }
    | { type: "move-to", index: number }
    | { type: "scroll-to-top" }
    // Opens the pane menu at the given position in the host window's coordinates.
    | { type: "open-menu", x: number, y: number };

export type Size = { width: number, height: number };
export type Point = { x: number, y: number };
export type Rect = { x: number, y: number, width: number, height: number };

// Messages sent from the host renderer to the main process.
export type HostToMainChannels = {
    "request-layout": [];
    "pane-command": [paneId: string, command: PaneCommand];
    // Bounds of the area where each pane's page is displayed, in the host window's coordinates.
    "pane-bounds": [bounds: Record<string, Rect>];
    // While suspended, pane pages are hidden so that the host renderer can draw over them.
    "set-views-suspended": [suspended: boolean];
    "add-pane": [sessionId: string, url: string];
    // Adds a new account with a pane where the user can log in.
    "add-account": [];
    // Opens the account menu at the given position in the host window's coordinates.
    "open-session-menu": [sessionId: string, x: number, y: number];
};

// Messages sent from the main process to the host renderer.
export type MainToHostChannels = {
    "layout": [layout: LayoutData];
    // Images of pane pages captured when the views are suspended, as data URLs keyed by pane ID.
    "pane-snapshots": [snapshots: Record<string, string>];
    "wheel-horizontal": [delta: number];
    // Requested from a native menu. The account is preselected if given.
    "open-add-pane-dialog": [sessionId: string | null];
};

// API exposed to the host renderer through contextBridge as `window.decktron`.
export type DecktronApi = {
    send: <K extends keyof HostToMainChannels>(channel: K, ...args: HostToMainChannels[K]) => void;
    // Returns a function that removes the listener.
    on: <K extends keyof MainToHostChannels>(channel: K, listener: (...args: MainToHostChannels[K]) => void) => () => void;
};
