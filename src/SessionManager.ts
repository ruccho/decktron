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
}