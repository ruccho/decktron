import React, { useEffect, useState } from "react";
import { getPaneTitle } from "./paneTitle";

const noticeDurationMs = 8000;

// Shows that a pane was closed, with a button to restore it.
const ClosedPaneNotice: React.FC = () => {
    const [closed, setClosed] = useState<{ title: string, time: number } | null>(null);

    useEffect(() => {
        return window.decktron.on("pane-closed", (url) => setClosed({ title: getPaneTitle(url), time: Date.now() }));
    }, []);

    useEffect(() => {
        if (!closed) return;
        const timer = setTimeout(() => setClosed(null), noticeDurationMs);
        return () => clearTimeout(timer);
    }, [closed]);

    if (!closed) return null;

    return (
        <div className="closed-pane-notice">
            <span className="closed-pane-notice-text">Closed {closed.title}</span>
            <button className="top-bar-button" onClick={() => {
                window.decktron.send("restore-closed-pane");
                setClosed(null);
            }}>Undo</button>
        </div>
    );
};

export default ClosedPaneNotice;
