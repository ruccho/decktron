import { useEffect, useSyncExternalStore } from "react";

// Pane pages are native views drawn over the host renderer. While any component requests suspension,
// the views are hidden and replaced with snapshots so that dialogs and drag operations can be drawn over the panes.

let requestCount = 0;
let snapshots: Record<string, string> = {};
const listeners = new Set<() => void>();

window.decktron.on("pane-snapshots", (value) => {
    if (requestCount <= 0) return;
    snapshots = value;
    listeners.forEach(l => l());
});

function acquire() {
    requestCount++;
    if (requestCount === 1) window.decktron.send("set-views-suspended", true);
}

function release() {
    requestCount--;
    if (requestCount > 0) return;
    window.decktron.send("set-views-suspended", false);
    snapshots = {};
    listeners.forEach(l => l());
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function useViewSuspension(active: boolean) {
    useEffect(() => {
        if (!active) return;
        acquire();
        return release;
    }, [active]);
}

export function usePaneSnapshot(paneId: string): string | undefined {
    return useSyncExternalStore(subscribe, () => snapshots[paneId]);
}
