import { contextBridge, ipcRenderer } from 'electron';
import { Fiber, WorkTag } from 'react-reconciler';

// eslint-disable-next-line no-var
declare var window: Window & typeof globalThis & {
    __INITIAL_STATE__: any,
};


if (location.host === "twitter.com") {
    preload();
}

function preload() {

    ipcRenderer.on("navigate", (event, value) => {
        console.log(value);
        if (typeof value !== "string") return;

        const navItem = document.querySelector<HTMLAnchorElement>(`header a[href='${value}']`);
        if (navItem) navItem.click();
        else location.href = value;
    });

    document.addEventListener("DOMContentLoaded", () => {

        ipcRenderer.send("background-color", document.body.style.backgroundColor);
        ipcRenderer.on("refresh", () => {
            location.reload();
        });
        waitForElement(document.body, "header", true, (header) => {
            (header as HTMLElement).style.display = "none";
        });
        /*
        waitForElement(document.body, "#react-root > div > div > div.css-1dbjc4n.r-18u37iz.r-13qz1uu.r-417010 > main > div", true, (container) => {

            const observer: MutationObserver = new MutationObserver(records => {
                console.log(location.href);

                ipcRenderer.send("log", location.href);
                ipcRenderer.send("log", location.href);
            })
        
            observer.observe(container, {
                childList: true,
                subtree: false
            });
        });
        */

        /*

        const renderer = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.get(1);
        waitForElement(document.body, "section.css-1dbjc4n", true, (timeline) => {

            setTimeout(() => {
                const fiber = renderer?.findFiberByHostInstance(timeline);

                const knownFibers: Set<Fiber> = new Set();

                const process = (f: Fiber | null, i: number) => {
                    if (!f || knownFibers.has(f)) return;
                    knownFibers.add(f);

                    console.log(f.stateNode, i);

                    process(f.return, ++i);
                }

                if (fiber) process(fiber, 0);
            }, 2000);
        });
        */

        const themeColorMeta = document.querySelector("meta[name='theme-color']");

        if (themeColorMeta) {
            const observer: MutationObserver = new MutationObserver(records => {
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
                eval(element.text);
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

    const observer: MutationObserver = new MutationObserver(records => {
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

    for (const [key, value] of Object.entries(timeline)) {
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
    const timelineFiber = getFiber("section.css-1dbjc4n");
    if (!timelineFiber) return;

    const stateNode = getAncestor(timelineFiber, 29)?.stateNode;

    console.log("fetchTop");
    stateNode?._timelineAPI?.fetchTop();
}

setInterval(() => {
    if (location.pathname !== "/home") return;
    fetchInitialOrTop();
}, 10_000);