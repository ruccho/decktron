import { IpcMainEvent } from "electron";
import { Pane } from "./Pane";

export type PaneHostBase = {
    send: (channel: string, ...args: any[]) => void;
    on: (channel: string, callback: (event: IpcMainEvent, ...args: any[]) => void) => void;
    remove: (pane: Pane) => void;

    addBrowserView: (pane: Pane) => void;
    removeBrowserView: (pane: Pane) => void;
}