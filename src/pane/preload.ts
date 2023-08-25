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
    document.addEventListener("DOMContentLoaded", () => {

        ipcRenderer.send("background-color", document.body.style.backgroundColor);
        ipcRenderer.on("x-fetchInitialOrTop", fetchInitialOrTop);
        waitForElement(document.body, "header", true, (header) => {
            (header as HTMLElement).style.display = "none";
        });

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

        const themeColor = document.querySelector("meta[name='theme-color']")?.getAttribute("content");

        if (themeColor) {
            ipcRenderer.send("theme-color", themeColor);
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

function fetchInitialOrTop() {
    const timeline = document.querySelector("section.css-1dbjc4n");

    if(!timeline) return;

    const key = Object.keys(timeline as any).find(value => value.startsWith("__reactFiber$"));

    if (!key) return;
    const timelineFiber: Fiber = (timeline as any)[key];
    let fiber: Fiber | null = timelineFiber;
    for (let i = 0; i < 29 && fiber; i++) fiber = fiber.return;
    if (!fiber) return;

    const stateNode = fiber.stateNode;

    console.log("fetchTop");
    stateNode?._timelineAPI?.fetchTop();
}

setInterval(() => {
    if(location.pathname !== "/home") return;
    fetchInitialOrTop();
}, 10_000);