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

    private id: string;
    public readonly view: BrowserView;
    public readonly data: PaneData;
    private host: PaneHostBase;

    constructor(host: PaneHostBase, session: PaneSession, initialUrl: string) {
        this.id = uuidv4();
        this.host = host;

        this.view = new BrowserView({
            webPreferences: {
                preload: PANE_VIEW_PRELOAD_WEBPACK_ENTRY,
                session: session.electronSession
            }
        });

        this.data = {
            id: this.id,
            canGoBack: false,
            canGoForward: false,
            session: session.data
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

            this.sendData();
        })

        this.host.on(this.dataChannel, () => {
            this.host.send(this.dataChannel, this.data);
        });
        this.host.send(this.dataChannel, this.data);

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
    }

    private get dataChannel() {
        return `pane-data-${this.id}`;
    }

    private sendData() {
        this.host.send(this.dataChannel, this.data);
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public dispose(){

    }
}
