import { Pane } from "./Pane";
import { PaneSession } from "./PaneSession";
import { UserData } from "../shared/common";

export type PaneHostBase = {
    onPaneDataChanged: (pane: Pane) => void;
    onPaneNavigated: (pane: Pane, url: string) => void;
    onPaneWheelHorizontal: (delta: number) => void;
    onSessionUserChanged: (session: PaneSession, user: UserData) => void;
}
