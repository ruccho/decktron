import { app, WebContents } from "electron";
import { join } from "node:path";

// Loads the renderer page. The hash selects what the page shows.
export function loadRenderer(webContents: WebContents, hash?: string) {
    const rendererUrl = process.env["ELECTRON_RENDERER_URL"];
    if (!app.isPackaged && rendererUrl) {
        webContents.loadURL(hash ? `${rendererUrl}#${hash}` : rendererUrl);
    } else {
        webContents.loadFile(join(__dirname, "../renderer/index.html"), { hash });
    }
}
