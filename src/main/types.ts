import { Pane } from "./Pane";
import { PaneSession } from "./PaneSession";
import { UserData } from "../shared/common";
import { Input } from "electron";

export type PaneHostBase = {
    onPaneDataChanged: (pane: Pane) => void;
    onPaneNavigated: (pane: Pane, url: string) => void;
    onPaneWheelHorizontal: (delta: number) => void;
    onSessionUserChanged: (session: PaneSession, user: UserData) => void;
    // Returns true if the input was handled as a shortcut.
    onPaneInput: (pane: Pane, input: Input) => boolean;
}
