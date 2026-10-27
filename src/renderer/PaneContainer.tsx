import Pane from "./Pane";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { LayoutData } from "../shared/common";
import { Rect } from "../shared/api";

const PaneContainer: React.FC<{
    layout: LayoutData,
}> = ({ layout }) => {

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
        </div>
    )
};

export default PaneContainer;
