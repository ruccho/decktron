import { LayoutData } from "./common";

export type PaneCommand =
    | { type: "refresh" }
    | { type: "back" }
    | { type: "forward" }
    | { type: "close" }
    | { type: "navigate", path: string }
    | { type: "move", shift: number }
    | { type: "move-to", index: number }
    | { type: "set-width", width: number }
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
    // Width of the side bar and the area where each pane's page is displayed, in the host window's coordinates.
    "pane-bounds": [sideBarWidth: number, bounds: Record<string, Rect>];
    // While suspended, pane pages are hidden so that the host renderer can draw over them.
    "set-views-suspended": [suspended: boolean];
    "add-pane": [sessionId: string, url: string];
    // Sent by the side bar view, which cannot show the dialog over the host renderer by itself.
    "open-add-pane-dialog": [];
    // Adds a new account with a pane where the user can log in.
    "add-account": [];
    // Opens the account menu at the given position in the host window's coordinates.
    "open-session-menu": [sessionId: string, x: number, y: number];
    // Reopens the pane closed most recently.
    "restore-closed-pane": [];
};

// Messages sent from the main process to the host renderer.
export type MainToHostChannels = {
    "layout": [layout: LayoutData];
    // Images of pane pages captured when the views are suspended, as data URLs keyed by pane ID.
    "pane-snapshots": [snapshots: Record<string, string>];
    "wheel-horizontal": [delta: number];
    // Requested from a native menu. The account is preselected if given.
    "open-add-pane-dialog": [sessionId: string | null];
    // Sent when a pane is closed in a way that can be undone.
    "pane-closed": [url: string];
};

// API exposed to the host renderer through contextBridge as `window.decktron`.
export type DecktronApi = {
    send: <K extends keyof HostToMainChannels>(channel: K, ...args: HostToMainChannels[K]) => void;
    // Returns a function that removes the listener.
    on: <K extends keyof MainToHostChannels>(channel: K, listener: (...args: MainToHostChannels[K]) => void) => () => void;
};
