import { ipcRenderer } from 'electron';
import type { Fiber } from 'react-reconciler';

// eslint-disable-next-line no-var
declare var window: Window & typeof globalThis & {
    __INITIAL_STATE__: any,
};


if (location.host === "x.com") {
    preload();
}

forwardHorizontalWheel();

// A WebContentsView does not chain scrolling to the host window, so horizontal wheel input
// that the page itself cannot consume is forwarded to the host to scroll the pane container.
function forwardHorizontalWheel() {
    window.addEventListener("wheel", (event) => {
        const delta = getHorizontalWheelDelta(event);
        if (delta === 0) return;
        if (canScrollHorizontally(event.target, delta)) return;

        // Send the delta in physical pixels so that the host can convert it regardless of the pane's zoom factor.
        ipcRenderer.send("wheel-horizontal", delta * window.devicePixelRatio);
    }, { capture: true, passive: true });
}

function getHorizontalWheelDelta(event: WheelEvent) {
    let delta: number;
    if (event.shiftKey && event.deltaX === 0) {
        // Shift + vertical wheel is treated as horizontal scrolling.
        delta = event.deltaY;
    } else if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        delta = event.deltaX;
    } else {
        return 0;
    }

    switch (event.deltaMode) {
        case WheelEvent.DOM_DELTA_LINE:
            return delta * 16;
        case WheelEvent.DOM_DELTA_PAGE:
            return delta * window.innerWidth;
        default:
            return delta;
    }
}

function canScrollHorizontally(target: EventTarget | null, delta: number) {
    for (let element = target instanceof Element ? target : null; element; element = element.parentElement) {
        if (element.scrollWidth <= element.clientWidth) continue;

        const overflowX = getComputedStyle(element).overflowX;
        const scrollable = overflowX === "auto" || overflowX === "scroll" || element === document.scrollingElement;
        if (!scrollable) continue;

        const canScroll = delta < 0
            ? element.scrollLeft > 0
            : element.scrollLeft + element.clientWidth < element.scrollWidth - 1;
        if (canScroll) return true;
    }
    return false;
}

function preload() {

    ipcRenderer.on("navigate", (event, value) => {
        if (typeof value !== "string") return;

        const navItem = document.querySelector<HTMLAnchorElement>(`header a[href='${value}']`);
        if (navItem) navItem.click();
        else location.href = value;
    });

    ipcRenderer.on("scroll-to-top", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    document.addEventListener("DOMContentLoaded", () => {

        waitForElement(document.body, "header", true, (header) => {
            (header as HTMLElement).style.display = "none";
        });

        const themeColorMeta = document.querySelector("meta[name='theme-color']");

        if (themeColorMeta) {
            const observer: MutationObserver = new MutationObserver(() => {
                const value = themeColorMeta.getAttribute("content");
                document.body.style.setProperty("--decktron-pane-background", value)
                ipcRenderer.send("theme-color", value);
            })

            observer.observe(themeColorMeta, {
                attributes: true,
                attributeFilter: [
                    "content"
                ]
            });
        }


        document.querySelectorAll("script").forEach(element => {
            if (element.text.startsWith("window.__INITIAL_STATE__")) {
                (0, eval)(element.text);
                ipcRenderer.send("initial-state", window.__INITIAL_STATE__);
            }

        })

    });
}


function waitForElement(container: Element, selector: string, subtree: boolean, callback: (coverContainer: Element) => void) {

    {
        const target = container.querySelector(selector);
        if (target) {
            callback(target);
            return;
        }
    }

    const observer: MutationObserver = new MutationObserver(() => {
        const target = container.querySelector(selector);
        if (target) {
            observer.disconnect();
            callback(target);
        }
    })

    observer.observe(container, {
        childList: true,
        subtree: subtree
    });
}


function getFiber(selector: string): Fiber | undefined {
    const timeline = document.querySelector(selector);
    if (!timeline) return;
    return getFiberFromElement(timeline);
}

function getFiberFromElement(element: Element): Fiber | undefined {
    for (const [key, value] of Object.entries(element)) {
        if (key.startsWith("__reactFiber$")) {
            return value;
        }
    }
}

function getAncestor(fiber: Fiber, hops: number) {
    let fiberCursor: Fiber | null = fiber;
    for (let i = 0; i < hops && fiberCursor; i++) fiberCursor = fiberCursor.return;
    return fiberCursor ?? undefined;
}

function fetchInitialOrTop() {
    const timelineFiber = getFiber("section.css-175oi2r");
    if (!timelineFiber) return;

    const stateNode = getAncestor(timelineFiber, 29)?.stateNode;

    // The internal structure of the page may change, so every step is optional.
    if (!stateNode?._timelineRenderer?._isAtNewest?.()) return;

    stateNode._timelineAPI?.fetchTop?.();
}

setInterval(() => {
    if (location.pathname !== "/home") return;
    fetchInitialOrTop();
}, 10_000);