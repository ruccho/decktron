import { BrowserWindow, dialog, Menu, MenuItemConstructorOptions, shell } from "electron";
import { randomUUID } from "node:crypto";
import { Pane } from "./Pane";
import { PaneSession } from "./PaneSession";
import { SessionManager } from "./SessionManager";
import { createPaneConfig, LayoutStore } from "./LayoutStore";
import { HostToMainChannels, MainToHostChannels, PaneCommand, Rect } from "../shared/api";
import { LayoutData, PaneConfig, paneZoomPresets, UserData } from "../shared/common";
import { clampPaneWidth, clampPaneZoom, isFiniteNumber, isRecord } from "./validation";

const showDevTools = false;

// Replaces each argument type with unknown, keeping the number of arguments.
type Unvalidated<T extends unknown[]> = { [I in keyof T]: unknown };

function parseRect(value: unknown): Rect | undefined {
    if (!isRecord(value)) return;
    const { x, y, width, height } = value;
    if (!isFiniteNumber(x) || !isFiniteNumber(y) || !isFiniteNumber(width) || !isFiniteNumber(height)) return;
    return { x, y, width, height };
}

function parsePaneCommand(value: unknown): PaneCommand | undefined {
    if (!isRecord(value)) return;
    switch (value.type) {
        case "refresh":
        case "back":
        case "forward":
        case "close":
        case "scroll-to-top":
            return { type: value.type };
        case "navigate":
            if (typeof value.path !== "string") return;
            return { type: value.type, path: value.path };
        case "move":
            if (!isFiniteNumber(value.shift)) return;
            return { type: value.type, shift: value.shift };
        case "move-to":
            if (!Number.isInteger(value.index)) return;
            return { type: value.type, index: value.index as number };
        case "set-width":
            if (!isFiniteNumber(value.width)) return;
            return { type: value.type, width: value.width };
        case "open-menu":
            if (!isFiniteNumber(value.x) || !isFiniteNumber(value.y)) return;
            return { type: value.type, x: value.x, y: value.y };
    }
}

// Transient pages such as the compose dialog or the login flow are not restored on the next launch.
const nonRestorablePathPrefixes = ["/compose/", "/i/flow/", "/i/jf/", "/login", "/logout"];

function isValidPaneUrl(url: string) {
    try {
        return new URL(url).protocol === "https:";
    } catch {
        return false;
    }
}

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

    private viewsSuspended = false;
    // Incremented on every change of viewsSuspended to discard outdated asynchronous work.
    private suspensionGeneration = 0;

    constructor(window: BrowserWindow, store: LayoutStore) {

        this.window = window;
        this.store = store;

        for (const config of store.get().panes) {
            this.createPane(config);
        }

        if (showDevTools && this.panes.length > 0) {
            this.panes[0].view.webContents.openDevTools();
        }

        // A reloaded renderer does not know that the views were suspended.
        window.webContents.on("did-finish-load", () => {
            this.setViewsSuspended(false);
        });

        window.webContents.ipc.on("log", (event, value) => {
            console.log(value);
        });

        this.on("request-layout", () => {
            this.sendLayout();
        });

        this.on("pane-command", (paneId, command) => {
            const pane = this.panes.find(p => p.id === paneId);
            const parsedCommand = parsePaneCommand(command);
            if (!pane || !parsedCommand) return;
            this.handlePaneCommand(pane, parsedCommand);
        });

        this.on("pane-bounds", (value) => {
            if (!isRecord(value)) return;
            for (const pane of this.panes) {
                const rect = parseRect(value[pane.id]);
                if (!rect) continue;
                pane.setBounds({
                    x: Math.round(rect.x),
                    y: Math.round(rect.y),
                    width: Math.max(0, Math.round(rect.width)),
                    height: Math.max(0, Math.round(rect.height)),
                });
            }
        });

        this.on("set-views-suspended", (value) => {
            if (typeof value !== "boolean") return;
            this.setViewsSuspended(value);
        });

        this.on("add-pane", (sessionId, url) => {
            if (typeof sessionId !== "string" || typeof url !== "string") return;
            if (!this.store.get().sessions.some(s => s.id === sessionId) || !isValidPaneUrl(url)) return;
            this.add(createPaneConfig(sessionId, url));
        });

        this.on("add-account", () => {
            const sessionId = randomUUID();
            this.store.update(state => ({ ...state, sessions: [...state.sessions, { id: sessionId }] }));
            this.add(createPaneConfig(sessionId, "https://x.com/home"));
        });

        this.on("open-session-menu", (sessionId, x, y) => {
            if (typeof sessionId !== "string" || !isFiniteNumber(x) || !isFiniteNumber(y)) return;
            if (!this.store.get().sessions.some(s => s.id === sessionId)) return;
            this.openSessionMenu(sessionId, x, y);
        });
    }

    private add(config: PaneConfig) {
        this.store.update(state => ({ ...state, panes: [...state.panes, config] }));
        this.createPane(config);
        this.sendLayout();
    }

    private openSessionMenu(sessionId: string, x: number, y: number) {
        const user = this.store.get().sessions.find(s => s.id === sessionId)?.user;
        const template: MenuItemConstructorOptions[] = [
            { label: user ? `@${user.screenName}` : "Not logged in", enabled: false },
            { type: "separator" },
            { label: "Add Pane...", click: () => this.send("open-add-pane-dialog", sessionId) },
            { label: "Remove Account...", click: () => this.confirmRemoveSession(sessionId) },
        ];
        Menu.buildFromTemplate(template).popup({ window: this.window, x: Math.round(x), y: Math.round(y) });
    }

    private async confirmRemoveSession(sessionId: string) {
        const user = this.store.get().sessions.find(s => s.id === sessionId)?.user;
        const name = user ? `@${user.screenName}` : "this account";
        const { response } = await dialog.showMessageBox(this.window, {
            type: "warning",
            message: `Remove ${name}?`,
            detail: "All panes of the account are closed, and its login and browsing data are deleted.",
            buttons: ["Remove", "Cancel"],
            defaultId: 1,
            cancelId: 1,
            noLink: true,
        });
        if (response !== 0) return;

        for (const pane of this.panes.filter(p => p.session.id === sessionId)) {
            this.remove(pane);
        }
        this.store.update(state => ({ ...state, sessions: state.sessions.filter(s => s.id !== sessionId) }));
        this.sendLayout();
        try {
            await this.sessions.clear(sessionId);
        } catch (e) {
            console.error(`Failed to clear the data of session ${sessionId}`, e);
        }
    }

    private createPane(config: PaneConfig, index = this.panes.length) {
        const pane = new Pane(this, this.sessions.get(config.sessionId), config);
        this.panes.splice(index, 0, pane);
        if (!this.viewsSuspended) this.window.contentView.addChildView(pane.view);
        return pane;
    }

    private handlePaneCommand(pane: Pane, command: PaneCommand) {
        switch (command.type) {
            case "close":
                this.remove(pane);
                break;
            case "move":
                this.moveShift(pane, command.shift);
                break;
            case "move-to":
                this.moveTo(pane, command.index);
                break;
            case "set-width":
                this.setPaneWidth(pane, command.width);
                break;
            case "open-menu":
                this.openPaneMenu(pane, command.x, command.y);
                break;
            default:
                pane.handleCommand(command);
                break;
        }
    }

    public remove(pane: Pane) {
        const index = this.panes.indexOf(pane);
        if (index < 0) return;

        this.window.contentView.removeChildView(pane.view);
        pane.dispose();
        this.panes.splice(index, 1);
        this.store.update(state => ({
            ...state,
            panes: state.panes.filter(p => p.id !== pane.id),
        }));
        this.sendLayout();
    }

    public moveShift(pane: Pane, shift: number) {
        const currentIndex = this.panes.indexOf(pane);
        if (currentIndex < 0) return;
        this.moveTo(pane, currentIndex + shift);
    }

    public moveTo(pane: Pane, index: number) {
        const currentIndex = this.panes.indexOf(pane);
        if (currentIndex < 0) return;

        const newIndex = Math.min(this.panes.length - 1, Math.max(0, index));
        if (newIndex === currentIndex) {
            // The renderer may have already reordered the panes, so send the actual order back.
            this.sendLayout();
            return;
        }

        this.panes.splice(currentIndex, 1);
        this.panes.splice(newIndex, 0, pane);
        this.savePaneOrder();
        this.sendLayout();
    }

    private openPaneMenu(pane: Pane, x: number, y: number) {
        const screenName = this.store.get().sessions.find(s => s.id === pane.session.id)?.user?.screenName;
        const index = this.panes.indexOf(pane);

        const navigate = (label: string, path: string | undefined): MenuItemConstructorOptions => ({
            label,
            enabled: path !== undefined,
            click: () => {
                if (path !== undefined) pane.handleCommand({ type: "navigate", path });
            },
        });

        const template: MenuItemConstructorOptions[] = [
            navigate("Post", "/compose/post"),
            { type: "separator" },
            navigate("Home", "/home"),
            navigate("Explore", "/explore"),
            navigate("Notifications", "/notifications"),
            navigate("Messages", "/messages"),
            navigate("Bookmarks", "/i/bookmarks"),
            navigate("Lists", screenName && `/${screenName}/lists`),
            navigate("Communities", screenName && `/${screenName}/communities`),
            navigate("Profile", screenName && `/${screenName}`),
            navigate("Drafts", "/compose/post/unsent/drafts"),
            navigate("Settings", "/settings"),
            { type: "separator" },
            {
                label: "Zoom",
                submenu: paneZoomPresets.map(zoom => ({
                    label: `${Math.round(zoom * 100)}%`,
                    type: "radio",
                    checked: Math.abs(pane.data.zoom - zoom) < 0.001,
                    click: () => this.setPaneZoom(pane, zoom),
                })),
            },
            { label: "Move Left", enabled: index > 0, click: () => this.moveShift(pane, -1) },
            { label: "Move Right", enabled: index < this.panes.length - 1, click: () => this.moveShift(pane, 1) },
            {
                label: "Open in Browser",
                enabled: /^https?:/.test(pane.data.url),
                click: () => shell.openExternal(pane.data.url),
            },
            { type: "separator" },
            { label: "Close Pane", click: () => this.remove(pane) },
        ];

        Menu.buildFromTemplate(template).popup({ window: this.window, x: Math.round(x), y: Math.round(y) });
    }

    private setPaneWidth(pane: Pane, width: number) {
        width = clampPaneWidth(width);
        pane.data.width = width;
        this.updatePaneConfig(pane.id, { width });
        this.sendLayout();
    }

    private setPaneZoom(pane: Pane, zoom: number) {
        zoom = clampPaneZoom(zoom);
        pane.setZoom(zoom);
        this.updatePaneConfig(pane.id, { zoom });
        this.sendLayout();
    }

    public onPaneDataChanged() {
        this.sendLayout();
    }

    public onPaneNavigated(pane: Pane, url: string) {
        this.sendLayout();
        if (!isRestorableUrl(url)) return;
        this.updatePaneConfig(pane.id, { url });
    }

    public onPaneWheelHorizontal(delta: number) {
        this.send("wheel-horizontal", delta);
    }

    public onSessionUserChanged(session: PaneSession, user: UserData) {
        const current = this.store.get().sessions.find(s => s.id === session.id)?.user;
        if (current && JSON.stringify(current) === JSON.stringify(user)) return;
        this.store.update(state => ({
            ...state,
            sessions: state.sessions.map(s => s.id === session.id ? { ...s, user } : s),
        }));
        this.sendLayout();
    }

    private async setViewsSuspended(suspended: boolean) {
        if (this.viewsSuspended === suspended) return;
        this.viewsSuspended = suspended;
        const generation = ++this.suspensionGeneration;

        if (!suspended) {
            for (const pane of this.panes) {
                this.window.contentView.addChildView(pane.view);
            }
            return;
        }

        // Send the snapshots before hiding the views so that the renderer can show them in their place.
        const snapshots: Record<string, string> = {};
        await Promise.all(this.panes.map(async pane => {
            try {
                const snapshot = await pane.capture();
                if (snapshot) snapshots[pane.id] = snapshot;
            } catch (e) {
                console.error(e);
            }
        }));
        if (generation !== this.suspensionGeneration) return;

        this.send("pane-snapshots", snapshots);
        for (const pane of this.panes) {
            this.window.contentView.removeChildView(pane.view);
        }
    }

    private updatePaneConfig(paneId: string, values: Partial<Omit<PaneConfig, "id">>) {
        this.store.update(state => ({
            ...state,
            panes: state.panes.map(p => p.id === paneId ? { ...p, ...values } : p),
        }));
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

    private sendLayout() {
        const layout: LayoutData = {
            sessions: this.store.get().sessions.map(s => ({ id: s.id, user: s.user })),
            panes: this.panes.map(p => ({ ...p.data })),
        };
        this.send("layout", layout);
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
}
