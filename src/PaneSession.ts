import { Session, session } from "electron";
import { SessionData } from "./common";

export class PaneSession {
    public readonly id: string;
    public readonly electronSession: Session;
    public readonly data: SessionData;

    private readonly onUpdatedCallbacks: ((session: PaneSession) => void)[] = [];

    constructor(id: string) {
        this.id = id;
        this.electronSession = session.fromPartition(`persist:decktron/pane-${id}`);
        this.data = {
            id: id
        }

        this.electronSession.webRequest.onHeadersReceived((details, callback) => {

            if (new URL(details.url).origin === "https://x.com" && details.responseHeaders) {
                const existingCsp = details.responseHeaders["content-security-policy"];

                if (existingCsp) {
                    existingCsp[0] = existingCsp[0].replace("script-src", "script-src 'unsafe-eval'");
                    details.responseHeaders["content-security-policy"] = existingCsp;
                }
            }

            callback({
                responseHeaders: {
                    ...details.responseHeaders,
                }
            })
        });
    }

    onUpdated(callback: (session: PaneSession) => void)
    {
        this.onUpdatedCallbacks.push(callback);
    }

    offUpdated(callback: (session: PaneSession) => void)
    {
        const index = this.onUpdatedCallbacks.indexOf(callback);
        if(index >= 0) this.onUpdatedCallbacks.splice(index, 1);
    }

    setDirty()
    {
        this.onUpdatedCallbacks.forEach(c => c(this));
    }
}