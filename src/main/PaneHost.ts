import { BrowserWindow } from "electron";
import { Pane } from "./Pane";
import { SessionManager } from "./SessionManager";
import { LayoutStore } from "./LayoutStore";
import { HostToMainChannels, MainToHostChannels, PaneCommand, Point, Size } from "../shared/api";
import { PaneConfig } from "../shared/common";

const showDevTools = false;

// Replaces each argument type with unknown, keeping the number of arguments.
type Unvalidated<T extends unknown[]> = { [I in keyof T]: unknown };

function isFiniteNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function parseSize(value: unknown): Size | undefined {
    if (!isRecord(value) || !isFiniteNumber(value.width) || !isFiniteNumber(value.height)) return;
    return { width: value.width, height: value.height };
}

function parsePoint(value: unknown): Point | undefined {
    if (!isRecord(value) || !isFiniteNumber(value.x) || !isFiniteNumber(value.y)) return;
    return { x: value.x, y: value.y };
}

function parsePaneCommand(value: unknown): PaneCommand | undefined {
    if (!isRecord(value)) return;
    switch (value.type) {
        case "refresh":
        case "back":
        case "forward":
        case "close":
            return { type: value.type };
        case "set-view-enabled":
            if (typeof value.enabled !== "boolean") return;
            return { type: value.type, enabled: value.enabled };
        case "navigate":
            if (typeof value.path !== "string") return;
            return { type: value.type, path: value.path };
        case "move":
            if (!isFiniteNumber(value.shift)) return;
            return { type: value.type, shift: value.shift };
    }
}

// Transient pages such as the compose dialog or the login flow are not restored on the next launch.
const nonRestorablePathPrefixes = ["/compose/", "/i/flow/", "/i/jf/", "/login", "/logout"];

function isRestorableUrl(url: string) {
    try {
        const { protocol, pathname } = new URL(url);
        if (protocol !== "https:") return false;
        return !nonRestorablePathPrefixes.some(prefix => pathname.startsWith(prefix));
    } catch {
        return false;
    }
}

export class PaneHost {

    private readonly window: BrowserWindow;
    private readonly store: LayoutStore;
    private readonly panes: Pane[] = [];
    private readonly sessions: SessionManager = new SessionManager();
    private contentSize: Size | undefined = undefined;
    private contentOffset: Point = { x: 0, y: 0 };

    constructor(window: BrowserWindow, store: LayoutStore) {

        this.window = window;
        this.store = store;

        for (const config of store.get().panes) {
            this.panes.push(new Pane(this, this.sessions.get(config.sessionId), config));
        }

        if (showDevTools && this.panes.length > 0) {
            this.panes[0].view.webContents.openDevTools();
        }

        window.webContents.ipc.on("log", (event, value) => {
            console.log(value);
        });

        this.on("request-panes", () => {
            this.sendPanes();
        });

        this.on("pane-command", (paneId, command) => {
            const pane = this.panes.find(p => p.id === paneId);
            const parsedCommand = parsePaneCommand(command);
            if (!pane || !parsedCommand) return;
            this.handlePaneCommand(pane, parsedCommand);
        });

        this.on("container-size", (value) => {
            const size = parseSize(value);
            if (!size) return;
            this.contentSize = size;
            this.adjustPanes();
        });

        this.on("container-offset", (value) => {
            const offset = parsePoint(value);
            if (!offset) return;
            this.contentOffset = offset;
            this.adjustPanes();
        });
    }

    private handlePaneCommand(pane: Pane, command: PaneCommand) {
        switch (command.type) {
            case "close":
                this.remove(pane);
                break;
            case "move":
                this.moveShift(pane, command.shift);
                break;
            default:
                pane.handleCommand(command);
                break;
        }
    }

    public remove(pane: Pane) {
        const index = this.panes.indexOf(pane);
        if (index < 0) return;

        pane.dispose();
        this.panes.splice(index, 1);
        this.store.update(state => ({
            ...state,
            panes: state.panes.filter(p => p.id !== pane.id),
        }));
        this.sendPanes();
        this.adjustPanes();
    }

    public moveShift(pane: Pane, shift: number) {
        const currentIndex = this.panes.indexOf(pane);
        if (currentIndex < 0) return;

        const newIndex = Math.min(this.panes.length - 1, Math.max(0, currentIndex + shift));
        if (newIndex === currentIndex) return;

        this.panes.splice(currentIndex, 1);
        this.panes.splice(newIndex, 0, pane);
        this.savePaneOrder();
        this.sendPanes();
        this.adjustPanes();
    }

    public addView(pane: Pane) {
        this.window.contentView.addChildView(pane.view);
        this.adjustPanes();
    }

    public removeView(pane: Pane) {
        this.window.contentView.removeChildView(pane.view);
        this.adjustPanes();
    }

    public onPaneDataChanged() {
        // Panes that share a session also share its data, so all panes are sent at once.
        this.sendPanes();
    }

    public onPaneNavigated(pane: Pane, url: string) {
        if (!isRestorableUrl(url)) return;
        this.store.update(state => ({
            ...state,
            panes: state.panes.map(p => p.id === pane.id ? { ...p, url } : p),
        }));
    }

    public onPaneWheelHorizontal(delta: number) {
        this.send("wheel-horizontal", delta);
    }

    private savePaneOrder() {
        this.store.update(state => {
            const configs = new Map(state.panes.map(p => [p.id, p]));
            return {
                ...state,
                panes: this.panes.map(p => configs.get(p.id)).filter((p): p is PaneConfig => p !== undefined),
            };
        });
    }

    private sendPanes() {
        this.send("panes", this.panes.map(p => p.data));
    }

    private send<K extends keyof MainToHostChannels>(channel: K, ...args: MainToHostChannels[K]) {
        this.window.webContents.send(channel, ...args);
    }

    // Arguments from the renderer are typed as unknown because they must be validated before use.
    private on<K extends keyof HostToMainChannels>(channel: K, callback: (...args: Unvalidated<HostToMainChannels[K]>) => void) {
        this.window.webContents.ipc.on(channel, (event, ...args) => {
            (callback as (...args: unknown[]) => void)(...args);
        });
    }

    private adjustPanes() {
        const size = this.window.getContentSize();

        const contentHeight = this.contentSize?.height ?? size[1];

        const width = 320;

        for (let i = 0; i < this.panes.length; i++) {
            const view = this.panes[i].view;
            const left = Math.round(i * width + this.contentOffset.x);
            const right = Math.round((i + 1) * width + this.contentOffset.x);
            const top = Math.round(this.contentOffset.y);
            const bottom = Math.round(contentHeight + this.contentOffset.y);

            const bounds = { x: left + 1, y: top, width: right - left - 1, height: bottom - top };
            view.setBounds(bounds);
        }
    }
}
