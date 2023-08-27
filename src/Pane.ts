import { BrowserView, shell } from "electron";
import { PaneSession } from "./PaneSession";
import { PaneData, XInitialState } from "./common";
import { PaneHostBase } from "./types";
import { v4 as uuidv4 } from 'uuid';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const paneCss = require("./pane/index.css");

declare const PANE_VIEW_WEBPACK_ENTRY: string;
declare const PANE_VIEW_PRELOAD_WEBPACK_ENTRY: string;

export class Pane {

    private readonly id: string;
    public readonly view: BrowserView;
    public readonly data: PaneData;
    private readonly host: PaneHostBase;
    private readonly session: PaneSession;

    private readonly onSessionUpdatedLambda: (session: PaneSession) => void;

    constructor(host: PaneHostBase, session: PaneSession, initialUrl: string) {
        this.id = uuidv4();
        this.host = host;
        this.session = session;

        this.view = new BrowserView({
            webPreferences: {
                preload: PANE_VIEW_PRELOAD_WEBPACK_ENTRY,
                session: session.electronSession,
                contextIsolation: false
            }
        });

        this.data = {
            id: this.id,
            session: session.data,
            viewEnabled: false
        };

        this.view.webContents.ipc.on("initial-state", (event, initialState?: XInitialState) => {

            if (!initialState) return;

            const users = Object.values(initialState.entities.users.entities);
            if (users.length <= 0) return;

            const user = users[0];

            this.data.session.user = {
                displayName: user.name,
                id: user.id_str,
                profileImageUrl: user.profile_image_url_https,
                screenName: user.screen_name
            }
            this.sendData();
        })
        this.view.webContents.ipc.on("theme-color", (event, themeColor: string) => {
            this.data.themeColor = themeColor;
            this.sendData();
        })
        this.view.webContents.ipc.on("log", (event, value) => {
            console.log(value);
        });
        this.host.on(this.dataChannel, () => {
            this.host.send(this.dataChannel, this.data);
        });
        this.host.send(this.dataChannel, this.data);

        const getChannel = (command: string) => `pane-${this.id}-${command}`;

        this.host.on(getChannel("refresh"), () => {
            this.refresh();
        });
        this.host.on(getChannel("back"), () => {
            this.back();
        });
        this.host.on(getChannel("forward"), () => {
            this.forward();
        });
        this.host.on(getChannel("close"), () => {
            this.close();
        });
        this.host.on(getChannel("view-enabled"), (event, value) => {
            if (typeof value !== "boolean") return;
            this.setViewEnabled(value);
        });
        this.host.on(getChannel("navigate"), (event, value) => {
            if (typeof value !== "string") return;
            this.view.webContents.send("navigate", value);
            this.setViewEnabled(true);
        });
        this.host.on(getChannel("left"), () => {
            this.host.moveShift(this, -1);
        });
        this.host.on(getChannel("right"), () => {
            this.host.moveShift(this, 1);
        });


        this.onSessionUpdatedLambda = () => {
            this.onSessionUpdated();
        };
        session.onUpdated(this.onSessionUpdatedLambda);

        this.view.webContents.loadURL(initialUrl);
        this.view.webContents.setWindowOpenHandler(({ url }) => {
            const urlObj = new URL(url);
            const protocol = urlObj.protocol;
            if (protocol === "http:" || protocol === "https:") {
                shell.openExternal(url);
            }
            return { action: 'deny' }
        })
        this.view.webContents.on("did-finish-load", () => {
            this.view.webContents.setZoomFactor(0.8);
            this.view.webContents.insertCSS(paneCss, {
                cssOrigin: "user"
            })
        });

        this.setViewEnabled(true);
    }

    private get dataChannel() {
        return `pane-data-${this.id}`;
    }

    private sendData() {
        this.host.send(this.dataChannel, this.data);
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public dispose() {
        this.setViewEnabled(false);
        this.view.webContents.closeDevTools();
        this.session.offUpdated(this.onSessionUpdatedLambda);
    }

    public refresh() {
        this.view.webContents.reload();
    }

    public back() {
        this.view.webContents.goBack();
    }

    public forward() {
        this.view.webContents.goForward();
    }

    public close() {
        this.host.remove(this);
    }

    private onSessionUpdated() {
        this.sendData();
    }

    private setViewEnabled(enabled: boolean) {
        if (this.data.viewEnabled === enabled) return;
        this.data.viewEnabled = enabled;
        if (enabled) {
            this.host.addBrowserView(this);
        } else {
            this.host.removeBrowserView(this);
        }
        this.sendData();
    }
}
