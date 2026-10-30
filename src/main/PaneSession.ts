import { Session, session } from "electron";

export class PaneSession {
    public readonly id: string;
    public readonly electronSession: Session;

    constructor(id: string) {
        this.id = id;
        this.electronSession = session.fromPartition(`persist:decktron/pane-${id}`);

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
}
