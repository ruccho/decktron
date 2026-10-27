import { Rectangle, shell, WebContentsView } from "electron";
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
        // The view stays invisible until the host renderer reports where the pane is.
        this.view.setBounds({ x: 0, y: 0, width: 0, height: 0 });

        this.data = {
            id: this.id,
            sessionId: session.id,
            url: config.url,
            width: config.width,
            zoom: config.zoom,
        };

        this.view.webContents.ipc.on("initial-state", (event, initialState?: XInitialState) => {

            if (!initialState) return;

            const users = Object.values(initialState.entities.users.entities);
            if (users.length <= 0) return;

            const user = users[0];

            this.host.onSessionUserChanged(this.session, {
                displayName: user.name,
                id: user.id_str,
                profileImageUrl: user.profile_image_url_https,
                screenName: user.screen_name
            });
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

        // Panes on the same origin would otherwise share the zoom factor.
        this.view.webContents.setZoomMode("isolated");
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
            this.view.webContents.setZoomFactor(this.data.zoom);
            this.view.webContents.insertCSS(paneCss, {
                cssOrigin: "user"
            })
        });
        this.view.webContents.on("before-input-event", (event, input) => {
            if (this.host.onPaneInput(this, input)) event.preventDefault();
        });
        this.view.webContents.on("did-navigate", (event, url) => {
            this.onNavigated(url);
        });
        this.view.webContents.on("did-navigate-in-page", (event, url, isMainFrame) => {
            if (isMainFrame) this.onNavigated(url);
        });
    }

    public dispose() {
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
            case "navigate":
                this.view.webContents.send("navigate", command.path);
                break;
            case "scroll-to-top":
                this.view.webContents.send("scroll-to-top");
                break;
        }
    }

    public setZoom(zoom: number) {
        this.data.zoom = zoom;
        this.view.webContents.setZoomFactor(zoom);
    }

    public setBounds(bounds: Rectangle) {
        this.view.setBounds(bounds);
    }

    // Returns the current page as a data URL, or undefined if the page is not visible.
    public async capture(): Promise<string | undefined> {
        const { width, height } = this.view.getBounds();
        if (width <= 0 || height <= 0) return;
        const image = await this.view.webContents.capturePage();
        if (image.isEmpty()) return;
        return `data:image/jpeg;base64,${image.toJPEG(85).toString("base64")}`;
    }

    private onNavigated(url: string) {
        this.data.url = url;
        this.host.onPaneNavigated(this, url);
    }
}
