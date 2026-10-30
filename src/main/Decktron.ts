import { BrowserWindow, Rectangle, screen } from "electron";
import { join } from "node:path";
import { PaneHost } from "./PaneHost";
import { LayoutStore } from "./LayoutStore";
import { loadRenderer } from "./loadRenderer";
import { WindowConfig } from "../shared/common";

// Returns true if the bounds overlap a display enough to be grabbed by the user.
function isVisibleOnAnyDisplay(bounds: Rectangle) {
    const minVisibleSize = 50;
    return screen.getAllDisplays().some(({ workArea }) => {
        const width = Math.min(bounds.x + bounds.width, workArea.x + workArea.width) - Math.max(bounds.x, workArea.x);
        const height = Math.min(bounds.y + bounds.height, workArea.y + workArea.height) - Math.max(bounds.y, workArea.y);
        return width >= minVisibleSize && height >= minVisibleSize;
    });
}

export class Decktron {
    constructor() {

        this.store = new LayoutStore();

        const windowConfig = this.store.get().window;
        const bounds = windowConfig && isVisibleOnAnyDisplay(windowConfig) ? windowConfig : undefined;

        const mainWindow = new BrowserWindow({
            ...(bounds
                ? { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }
                : { width: 800, height: 600 }),
            webPreferences: {
                preload: join(__dirname, "../preload/host.js"),
            },
        });

        mainWindow.setMenu(null);
        // Applying the bounds again after creation prevents the window from growing on every launch,
        // which happens on Windows when the bounds are given only to the constructor.
        if (bounds) mainWindow.setBounds({ x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height });
        if (windowConfig?.maximized) mainWindow.maximize();

        const saveWindowConfig = () => {
            const { x, y, width, height } = mainWindow.getNormalBounds();
            const window: WindowConfig = { x, y, width, height, maximized: mainWindow.isMaximized() };
            // With fractional display scaling, the bounds read back may differ from the applied ones by rounding.
            // Ignoring such small differences keeps the window from drifting on every launch.
            const saved = this.store.get().window;
            if (saved && saved.maximized === window.maximized
                && [saved.x - x, saved.y - y, saved.width - width, saved.height - height].every(d => Math.abs(d) <= 1)) return;
            this.store.update(state => ({ ...state, window }));
        };
        mainWindow.on("resize", saveWindowConfig);
        mainWindow.on("move", saveWindowConfig);
        mainWindow.on("maximize", saveWindowConfig);
        mainWindow.on("unmaximize", saveWindowConfig);
        mainWindow.on("close", () => {
            saveWindowConfig();
            this.store.flush();
        });

        this.paneHost = new PaneHost(mainWindow, this.store);

        loadRenderer(mainWindow.webContents);
    }

    private readonly store: LayoutStore;
    private readonly paneHost: PaneHost;

}
