import { Pane } from "./Pane";

export type PaneHostBase = {
    addView: (pane: Pane) => void;
    removeView: (pane: Pane) => void;

    onPaneDataChanged: (pane: Pane) => void;
    onPaneNavigated: (pane: Pane, url: string) => void;
    onPaneWheelHorizontal: (delta: number) => void;
}
