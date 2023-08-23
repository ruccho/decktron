import { contextBridge, ipcRenderer } from 'electron';

// eslint-disable-next-line no-var
declare var window: Window & typeof globalThis & {
    __INITIAL_STATE__: any
};

if (location.host === "twitter.com") {
    preload();
}

function preload() {
    document.addEventListener("DOMContentLoaded", () => {
        ipcRenderer.send("background-color", document.body.style.backgroundColor);
        waitForElement(document.body, "header", true, (header) => {
            (header as HTMLElement).style.display = "none";
        });

        const themeColor = document.querySelector("meta[name='theme-color']")?.getAttribute("content");

        if(themeColor)
        {
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