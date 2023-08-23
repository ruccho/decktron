// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { IpcRenderer, ipcRenderer } from "electron";

// eslint-disable-next-line no-var
declare var window: {ipcRenderer: IpcRenderer};

window.ipcRenderer = ipcRenderer;