import React, { useRef, useState } from "react";
import { paneWidthLimits } from "../shared/common";
import { useViewSuspension } from "./viewSuspension";

function clampWidth(width: number) {
    return Math.round(Math.min(paneWidthLimits.max, Math.max(paneWidthLimits.min, width)));
}

// A handle at the right edge of a pane for changing its width by dragging.
// The width while dragging is passed to onPreview, and the final width to onCommit.
const PaneResizeHandle: React.FC<{
    width: number,
    onPreview: (width: number | null) => void,
    onCommit: (width: number) => void,
}> = ({ width, onPreview, onCommit }) => {
    const [resizing, setResizing] = useState(false);
    const start = useRef<{ x: number, width: number } | null>(null);

    // Pointer events over the pane views do not reach the host renderer, so the views are suspended.
    useViewSuspension(resizing);

    const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        start.current = { x: event.clientX, width };
        setResizing(true);
    };

    const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!start.current) return;
        onPreview(clampWidth(start.current.width + event.clientX - start.current.x));
    };

    const finish = (event: React.PointerEvent<HTMLDivElement>, commit: boolean) => {
        if (!start.current) return;
        const newWidth = clampWidth(start.current.width + event.clientX - start.current.x);
        start.current = null;
        setResizing(false);
        if (commit && newWidth !== width) onCommit(newWidth);
        else onPreview(null);
    };

    return (
        <div
            className={`pane-resize-handle ${resizing ? "resizing" : ""}`}
            title="Drag to resize. Double-click to reset."
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={(event) => finish(event, true)}
            onPointerCancel={(event) => finish(event, false)}
            onDoubleClick={() => onCommit(paneWidthLimits.default)} />
    );
};

export default PaneResizeHandle;
