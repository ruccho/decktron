import { IpcMainEvent } from "electron";

export type PaneHostBase = {
    send: (channel: string, ...args: any[]) => void;
    on: (channel: string, callback: (event: IpcMainEvent, ...args: any[]) => void) => void;
}