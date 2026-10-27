import Pane from "./Pane";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { LayoutData } from "../shared/common";
import { Rect } from "../shared/api";

const PaneContainer: React.FC<{
    layout: LayoutData,
    onAddPane: () => void,
}> = ({ layout, onAddPane }) => {

    const paneContainer = useRef<HTMLDivElement>(null);
    const contentElements = useRef(new Map<string, HTMLDivElement>());
    const resizeObserver = useRef<ResizeObserver | null>(null);
    const frameRequest = useRef<number | null>(null);

    // Reports where each pane's page should be displayed. Coalesced into one message per frame.
    const reportBounds = useCallback(() => {
        if (frameRequest.current !== null) return;
        frameRequest.current = requestAnimationFrame(() => {
            frameRequest.current = null;
            const container = paneContainer.current;
            if (!container) return;

            // Pages are clipped to the container so that they do not cover the rest of the host window.
            const containerRect = container.getBoundingClientRect();
            const bounds: Record<string, Rect> = {};
            for (const [id, element] of contentElements.current) {
                const rect = element.getBoundingClientRect();
                const top = Math.max(rect.top, containerRect.top);
                const bottom = Math.min(rect.bottom, containerRect.bottom);
                bounds[id] = { x: rect.left, y: top, width: rect.width, height: Math.max(0, bottom - top) };
            }
            window.decktron.send("pane-bounds", bounds);
        });
    }, []);

    useEffect(() => {
        const container = paneContainer.current;
        if (!container) return;

        const observer = new ResizeObserver(reportBounds);
        resizeObserver.current = observer;
        observer.observe(container);
        for (const element of contentElements.current.values()) observer.observe(element);

        container.addEventListener("scroll", reportBounds);
        window.addEventListener("resize", reportBounds);

        // Horizontal wheel input forwarded from panes, in physical pixels.
        const unsubscribeWheel = window.decktron.on("wheel-horizontal", (delta) => {
            container.scrollBy({ left: delta / window.devicePixelRatio, behavior: "instant" });
        });

        return () => {
            observer.disconnect();
            resizeObserver.current = null;
            container.removeEventListener("scroll", reportBounds);
            window.removeEventListener("resize", reportBounds);
            unsubscribeWheel();
            if (frameRequest.current !== null) cancelAnimationFrame(frameRequest.current);
            frameRequest.current = null;
        }
    }, [reportBounds]);

    // Positions change when panes are added, removed, reordered or resized.
    useLayoutEffect(() => {
        reportBounds();
    }, [layout, reportBounds]);

    // Scrolls to panes added after the first layout so that the user can see them.
    const knownPaneIds = useRef<Set<string> | null>(null);
    useLayoutEffect(() => {
        const ids = new Set(layout.panes.map(p => p.id));
        const known = knownPaneIds.current;
        if (known && layout.panes.length > 0) {
            const added = layout.panes.find(p => !known.has(p.id));
            if (added) contentElements.current.get(added.id)?.parentElement?.scrollIntoView({ behavior: "smooth", inline: "nearest" });
        }
        // Ignore the initial empty layout that is shown before the first message arrives.
        if (known || layout.panes.length > 0 || layout.sessions.length > 0) knownPaneIds.current = ids;
    }, [layout]);

    const registerContent = useCallback((id: string, element: HTMLDivElement | null) => {
        const previous = contentElements.current.get(id);
        if (previous) resizeObserver.current?.unobserve(previous);
        if (element) {
            contentElements.current.set(id, element);
            resizeObserver.current?.observe(element);
        } else {
            contentElements.current.delete(id);
        }
    }, []);

    return (
        <div className="pane-container" ref={paneContainer}>
            {
                layout.panes.map(pane => (
                    <Pane
                        pane={pane}
                        session={layout.sessions.find(s => s.id === pane.sessionId)}
                        registerContent={registerContent}
                        key={pane.id} />
                ))
            }
            {layout.panes.length === 0 ? (
                <div className="pane-container-empty">
                    <p>No panes.</p>
                    <button className="dialog-button primary" onClick={onAddPane}>Add Pane</button>
                </div>
            ) : (
                <button className="pane-add-column" onClick={onAddPane} title="Add pane">
                    <FontAwesomeIcon icon={faPlus} />
                </button>
            )}
        </div>
    )
};

export default PaneContainer;
