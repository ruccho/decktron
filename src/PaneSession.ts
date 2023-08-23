import { Session, session } from "electron";
import { SessionData } from "./common";

export class PaneSession{
    public readonly id: string;
    public readonly electronSession: Session;
    public readonly data: SessionData;

    constructor(id: string)
    {
        this.id = id;
        this.electronSession = session.fromPartition(`persist:decktron/pane-${id}`);
        this.data = {
            id: id
        }
    }
}