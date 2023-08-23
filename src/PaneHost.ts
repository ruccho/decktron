import { BrowserWindow, IpcMainEvent, WebContents } from "electron";
import { Pane } from "./Pane";
import { PaneSession } from "./PaneSession";
import { SessionManager } from "./SessionManager";

declare const HOST_WEBPACK_ENTRY: string;

const entryUrls: { [k: string]: string } = {
    "home": "https://twitter.com/home",
    "explore": "https://twitter.com/explore",
    "notifications": "https://twitter.com/notifications",
    /*
    "messages": "https://twitter.com/messages",
    "bookmarks": "https://twitter.com/i/bookmarks",
    "settings": "https://twitter.com/settings",
    */
}

const numSessions = 2;

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

        this.window.addBrowserView(pane.view);
        this.panes.push(pane);
        this.sendPaneIds();
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

    adjustPanes() {
        const views = this.window.getBrowserViews();
        const size = this.window.getContentSize();

        const contentWidth = this.contentSize?.width ?? size[0];
        const contentHeight = this.contentSize?.height ?? size[1];

        const width = 320;

        for (let i = 0; i < views.length; i++) {
            const left = Math.round(i * width + this.contentOffset.x);
            const right = Math.round((i + 1) * width + this.contentOffset.x);
            const top = Math.round(this.contentOffset.y);
            const bottom = Math.round(contentHeight + this.contentOffset.y);

            const bounds = { x: left, y: top, width: right - left, height: bottom - top };
            views[i].setBounds(bounds);
        }
    }
}