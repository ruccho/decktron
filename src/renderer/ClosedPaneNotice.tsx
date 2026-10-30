import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { getPaneTitle } from "./paneTitle";

const noticeDurationMs = 8000;

// A button shown for a while after a pane is closed, which restores the pane.
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
        <button
            // Restarts the animation when another pane is closed.
            key={closed.time}
            className="side-bar-button closed-pane-notice"
            title={`Reopen closed pane: ${closed.title}`}
            onClick={() => {
                window.decktron.send("restore-closed-pane");
                setClosed(null);
            }}>
            <FontAwesomeIcon icon={faRotateLeft} />
        </button>
    );
};

export default ClosedPaneNotice;
