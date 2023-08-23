import { contextBridge, ipcRenderer } from 'electron';

// eslint-disable-next-line no-var
declare var window: Window & typeof globalThis & {
    __INITIAL_STATE__: {
        entities: {
            users: {
                entities: Record<string, {
                    name: string;
                    screen_name: string;
                    profile_banner_url: string;
                }>
            }
        }
    }
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

        document.querySelectorAll("script").forEach(element => {
            if (element.text.startsWith("window.__INITIAL_STATE__")) {
                eval(element.text);

                const users = Object.values(window.__INITIAL_STATE__.entities.users.entities);
                if (users.length > 0) {
                    const user = users[0];
                    ipcRenderer.send("user", user);
                }
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