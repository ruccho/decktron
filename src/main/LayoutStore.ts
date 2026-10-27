import { app } from "electron";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { LayoutState, PaneConfig, SessionConfig, WindowConfig } from "../shared/common";

const defaultUrls = [
    "https://x.com/home",
    "https://x.com/explore",
    "https://x.com/notifications",
    "https://x.com/settings",
];

// Session IDs used before the layout was persisted. Reusing them keeps existing logins.
const defaultSessionIds = ["0", "1"];

const saveDelayMs = 500;

function createDefaultState(): LayoutState {
    const panes: PaneConfig[] = [];
    for (const url of defaultUrls) {
        for (const sessionId of defaultSessionIds) {
            panes.push({ id: randomUUID(), sessionId, url });
        }
    }
    return {
        version: 1,
        sessions: defaultSessionIds.map(id => ({ id })),
        panes,
    };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function parseSession(value: unknown): SessionConfig | undefined {
    if (!isRecord(value) || typeof value.id !== "string") return;
    return { id: value.id };
}

function parsePane(value: unknown, sessionIds: Set<string>): PaneConfig | undefined {
    if (!isRecord(value)) return;
    if (typeof value.id !== "string" || typeof value.sessionId !== "string" || typeof value.url !== "string") return;
    if (!sessionIds.has(value.sessionId)) return;
    return { id: value.id, sessionId: value.sessionId, url: value.url };
}

function parseWindow(value: unknown): WindowConfig | undefined {
    if (!isRecord(value)) return;
    const { x, y, width, height, maximized } = value;
    if (![x, y, width, height].every(v => typeof v === "number" && Number.isFinite(v))) return;
    return {
        x: x as number,
        y: y as number,
        width: width as number,
        height: height as number,
        maximized: maximized === true,
    };
}

function parseState(value: unknown): LayoutState | undefined {
    if (!isRecord(value) || value.version !== 1) return;
    if (!Array.isArray(value.sessions) || !Array.isArray(value.panes)) return;

    const sessions = value.sessions.map(parseSession).filter(s => s !== undefined);
    const sessionIds = new Set(sessions.map(s => s.id));
    const panes = value.panes.map(p => parsePane(p, sessionIds)).filter(p => p !== undefined);

    return {
        version: 1,
        sessions,
        panes,
        window: parseWindow(value.window),
    };
}

// Loads and saves LayoutState as a JSON file in the user data directory.
// Saving is debounced; call flush() before the application quits.
export class LayoutStore {

    private readonly path: string;
    private state: LayoutState;
    private saveTimer: ReturnType<typeof setTimeout> | undefined;

    constructor() {
        this.path = join(app.getPath("userData"), "layout.json");
        this.state = this.load();
    }

    public get(): LayoutState {
        return this.state;
    }

    public update(updater: (state: LayoutState) => LayoutState) {
        this.state = updater(this.state);
        this.scheduleSave();
    }

    public flush() {
        if (this.saveTimer === undefined) return;
        clearTimeout(this.saveTimer);
        this.saveTimer = undefined;
        this.save();
    }

    private load(): LayoutState {
        if (!existsSync(this.path)) return createDefaultState();

        try {
            const state = parseState(JSON.parse(readFileSync(this.path, "utf-8")));
            if (state) return state;
            console.error(`Invalid layout file: ${this.path}`);
        } catch (e) {
            console.error(`Failed to read layout file: ${this.path}`, e);
        }

        // Keep the unreadable file so that it is not overwritten by the default state.
        try {
            renameSync(this.path, `${this.path}.bak`);
        } catch (e) {
            console.error(e);
        }
        return createDefaultState();
    }

    private scheduleSave() {
        if (this.saveTimer !== undefined) clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => {
            this.saveTimer = undefined;
            this.save();
        }, saveDelayMs);
    }

    // The file is small, so it is written synchronously to avoid races between pending writes.
    private save() {
        try {
            const tempPath = `${this.path}.tmp`;
            writeFileSync(tempPath, JSON.stringify(this.state, null, 2));
            renameSync(tempPath, this.path);
        } catch (e) {
            console.error(`Failed to save layout file: ${this.path}`, e);
        }
    }
}
