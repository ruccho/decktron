import { BrowserWindow } from "electron";
import { PaneHost } from "./PaneHost";

declare const HOST_WEBPACK_ENTRY: string;
declare const HOST_PRELOAD_WEBPACK_ENTRY: string;

export class Decktron {
    constructor() {

        const mainWindow = new BrowserWindow({
            height: 600,
            width: 800,
            webPreferences: {
                preload: HOST_PRELOAD_WEBPACK_ENTRY,
                contextIsolation: false
            },
        });

        mainWindow.loadURL(HOST_WEBPACK_ENTRY);

        this.paneHost = new PaneHost(mainWindow);
    }

    private readonly paneHost: PaneHost;

}