// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import type { DecktronApi } from "../shared/api";

const api: DecktronApi = {
    send: (channel, ...args) => ipcRenderer.send(channel, ...args),
    on: (channel, listener) => {
        const callback = (_event: IpcRendererEvent, ...args: any[]) => listener(...args);
        ipcRenderer.on(channel, callback);
        return () => {
            ipcRenderer.off(channel, callback);
        };
    },
};

contextBridge.exposeInMainWorld("decktron", api);
