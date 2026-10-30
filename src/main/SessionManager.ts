import { PaneSession } from "./PaneSession";

export class SessionManager {

    private readonly sessions: Record<string, PaneSession> = {};

    get(id: string)
    {
        if(!this.sessions[id])
        {
            this.sessions[id] = new PaneSession(id);
        }
        
        return this.sessions[id];
    }

    // Deletes all data of the session, including logins.
    async clear(id: string)
    {
        const session = this.get(id);
        delete this.sessions[id];
        await session.electronSession.clearStorageData();
        await session.electronSession.clearCache();
    }
}
