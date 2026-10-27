import { app, BrowserWindow } from "electron";
import { join } from "node:path";
import { PaneHost } from "./PaneHost";

export class Decktron {
    constructor() {

        const mainWindow = new BrowserWindow({
            height: 600,
            width: 800,
            webPreferences: {
                preload: join(__dirname, "../preload/host.js"),
            },
        });

        mainWindow.setMenu(null);

        this.paneHost = new PaneHost(mainWindow);

        const rendererUrl = process.env["ELECTRON_RENDERER_URL"];
        if (!app.isPackaged && rendererUrl) {
            mainWindow.loadURL(rendererUrl);
        } else {
            mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
        }
    }

    private readonly paneHost: PaneHost;

}
