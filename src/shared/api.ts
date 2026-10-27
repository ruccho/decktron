// API exposed to the host renderer through contextBridge as `window.decktron`.
export type DecktronApi = {
    send: (channel: string, ...args: unknown[]) => void;
    // Returns a function that removes the listener.
    on: (channel: string, listener: (...args: any[]) => void) => () => void;
};
