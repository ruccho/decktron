import { BrowserWindow, IpcMainEvent, WebContents } from "electron";
import { Pane } from "./Pane";
import { PaneSession } from "./PaneSession";
import { SessionManager } from "./SessionManager";

declare const HOST_WEBPACK_ENTRY: string;

const entryUrls: { [k: string]: string } = {
    "home": "https://x.com/home",
    "explore": "https://x.com/explore",
    "notifications": "https://x.com/notifications",
    "settings": "https://x.com/settings",
    /*
    "messages": "https://x.com/messages",
    "bookmarks": "https://x.com/i/bookmarks",
    */
}

const numSessions = 2;
const showDevTools = false;

export class PaneHost {

    private readonly window: BrowserWindow;
    private readonly panes: Pane[] = [];
    private readonly sessions: SessionManager = new SessionManager();
    private contentSize: { width: number, height: number } | undefined = undefined;
    private contentOffset: { x: number, y: number } = { x: 0, y: 0 };

    constructor(window: BrowserWindow) {

        this.window = window;


        window.webContents.loadURL(HOST_WEBPACK_ENTRY);

        window.webContents.on("did-finish-load", () => {

            window.getBrowserViews().forEach(v => window.removeBrowserView(v));
            this.clear();

            for (const entryUrl of Object.values(entryUrls)) {
                for (let s = 0; s < numSessions; s++) {
                    this.add(this.sessions.get(s.toString()), entryUrl);
                }
            }

            if (showDevTools) {
                const firstPane = this.panes[0];
                firstPane.view.webContents.openDevTools();
            }
        })



        window.webContents.ipc.on("log", (event, value) => {
            console.log(value);
        });

        window.webContents.ipc.on("background-color", (event, value) => {
            this.window.webContents.send("background-color", value);
        });

        window.webContents.ipc.on("container-size", (event, value) => {
            this.contentSize = value;
            this.adjustPanes()
        });

        window.webContents.ipc.on("container-offset", (event, value) => {
            this.contentOffset = value;
            this.adjustPanes()
        });

        window.webContents.ipc.on("pane-ids", () => {
            this.sendPaneIds();
        });
    }

    private clear() {
        for (const pane of this.panes) {
            pane.dispose();
            this.window.removeBrowserView(pane.view);
        }
        this.panes.splice(0);
    }

    private add(session: PaneSession, initialUrl: string) {

        const pane = new Pane(this, session, initialUrl);

        this.panes.push(pane);
        this.sendPaneIds();
    }

    public remove(pane: Pane) {
        const index = this.panes.indexOf(pane);
        if (index < 0) return;

        pane.dispose();
        this.window.removeBrowserView(pane.view);
        this.panes.splice(index, 1);
        this.sendPaneIds();
        this.adjustPanes();
    }

    public move(pane: Pane, index: number) {
        const currentIndex = this.panes.indexOf(pane);
        if (currentIndex < 0) return;

        this.panes.splice(currentIndex, 1);
        this.panes.splice(index, 0, pane);
        this.sendPaneIds();
        this.adjustPanes();
    }

    public moveShift(pane: Pane, shift: number) {
        const currentIndex = this.panes.indexOf(pane);
        if (currentIndex < 0) return;

        const newIndex = Math.min(this.panes.length - 1, Math.max(0, currentIndex + shift));

        this.panes.splice(currentIndex, 1);
        this.panes.splice(newIndex, 0, pane);
        this.sendPaneIds();
        this.adjustPanes();
    }

    public addBrowserView(pane: Pane) {
        this.window.addBrowserView(pane.view);
        this.adjustPanes();
    }

    public removeBrowserView(pane: Pane) {
        this.window.removeBrowserView(pane.view);
        this.adjustPanes();
    }

    private sendPaneIds() {
        this.send("pane-ids", this.panes.map(p => p.data.id));
    }

    public send(channel: string, ...args: any[]) {
        this.window.webContents.send(channel, ...args);
    }

    public on(channel: string, callback: (event: IpcMainEvent, ...args: any[]) => void) {
        this.window.webContents.ipc.on(channel, callback);
    }

    private adjustPanes() {
        const size = this.window.getContentSize();

        const contentWidth = this.contentSize?.width ?? size[0];
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