import { shell, WebContentsView } from "electron";
import { join } from "node:path";
import { PaneSession } from "./PaneSession";
import { PaneConfig, PaneData, XInitialState } from "../shared/common";
import { PaneCommand } from "../shared/api";
import { PaneHostBase } from "./types";
import paneCss from "./pane.css?raw";

export class Pane {

    public readonly id: string;
    public readonly view: WebContentsView;
    public readonly data: PaneData;
    private readonly host: PaneHostBase;
    public readonly session: PaneSession;

    constructor(host: PaneHostBase, session: PaneSession, config: PaneConfig) {
        this.id = config.id;
        this.host = host;
        this.session = session;

        this.view = new WebContentsView({
            webPreferences: {
                preload: join(__dirname, "../preload/pane.js"),
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
            this.host.onPaneDataChanged(this);
        })
        this.view.webContents.ipc.on("theme-color", (event, themeColor: string) => {
            this.data.themeColor = themeColor;
            this.host.onPaneDataChanged(this);
        })
        this.view.webContents.ipc.on("log", (event, value) => {
            console.log(value);
        });
        this.view.webContents.ipc.on("wheel-horizontal", (event, delta) => {
            if (typeof delta !== "number" || !Number.isFinite(delta)) return;
            this.host.onPaneWheelHorizontal(delta);
        });

        this.view.webContents.loadURL(config.url);
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
        this.view.webContents.on("did-navigate", (event, url) => {
            this.host.onPaneNavigated(this, url);
        });
        this.view.webContents.on("did-navigate-in-page", (event, url, isMainFrame) => {
            if (isMainFrame) this.host.onPaneNavigated(this, url);
        });

        this.setViewEnabled(true);
    }

    public dispose() {
        this.setViewEnabled(false);
        this.view.webContents.closeDevTools();
        this.view.webContents.close();
    }

    // Handles commands that only affect this pane. Commands that affect the layout are handled by the host.
    public handleCommand(command: PaneCommand) {
        switch (command.type) {
            case "refresh":
                this.view.webContents.reload();
                break;
            case "back":
                this.view.webContents.navigationHistory.goBack();
                break;
            case "forward":
                this.view.webContents.navigationHistory.goForward();
                break;
            case "set-view-enabled":
                this.setViewEnabled(command.enabled);
                break;
            case "navigate":
                this.view.webContents.send("navigate", command.path);
                this.setViewEnabled(true);
                break;
        }
    }

    private setViewEnabled(enabled: boolean) {
        if (this.data.viewEnabled === enabled) return;
        this.data.viewEnabled = enabled;
        if (enabled) {
            this.host.addView(this);
        } else {
            this.host.removeView(this);
        }
        this.host.onPaneDataChanged(this);
    }
}
