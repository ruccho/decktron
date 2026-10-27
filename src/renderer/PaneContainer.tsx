import Pane from "./Pane";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { DndContext, DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import { useViewSuspension } from "./viewSuspension";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { LayoutData, PaneData } from "../shared/common";
import { Rect } from "../shared/api";

const PaneContainer: React.FC<{
    layout: LayoutData,
    onAddPane: () => void,
}> = ({ layout, onAddPane }) => {

    const paneContainer = useRef<HTMLDivElement>(null);

    // Pane views cannot follow the dragged panes, so they are suspended while dragging.
    const [dragging, setDragging] = useState(false);
    useViewSuspension(dragging);

    // The order after a drop is shown until the main process sends the updated layout.
    const [pendingOrder, setPendingOrder] = useState<{ base: LayoutData, ids: string[] } | null>(null);
    const panes = pendingOrder?.base === layout
        ? pendingOrder.ids.map(id => layout.panes.find(p => p.id === id)).filter((p): p is PaneData => p !== undefined)
        : layout.panes;

    // A small distance is required to start dragging so that the buttons in the header can be clicked.
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

    const onDragEnd = (event: DragEndEvent) => {
        setDragging(false);
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const ids = panes.map(p => p.id);
        const oldIndex = ids.indexOf(String(active.id));
        const newIndex = ids.indexOf(String(over.id));
        if (oldIndex < 0 || newIndex < 0) return;

        setPendingOrder({ base: layout, ids: arrayMove(ids, oldIndex, newIndex) });
        window.decktron.send("pane-command", String(active.id), { type: "move-to", index: newIndex });
    };
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

            // The main process clips the pages to the container's client area, excluding the scroll bar.
            const containerRect = container.getBoundingClientRect();
            const clientRect: Rect = {
                x: containerRect.left + container.clientLeft,
                y: containerRect.top + container.clientTop,
                width: container.clientWidth,
                height: container.clientHeight,
            };
            const bounds: Record<string, Rect> = {};
            for (const [id, element] of contentElements.current) {
                const rect = element.getBoundingClientRect();
                bounds[id] = { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
            }
            window.decktron.send("pane-bounds", clientRect, bounds);
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
    }, [panes, reportBounds]);

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
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToHorizontalAxis]}
                onDragStart={() => setDragging(true)}
                onDragEnd={onDragEnd}
                onDragCancel={() => setDragging(false)}>
                <SortableContext items={panes.map(p => p.id)} strategy={horizontalListSortingStrategy}>
                    {
                        panes.map(pane => (
                            <Pane
                                pane={pane}
                                session={layout.sessions.find(s => s.id === pane.sessionId)}
                                registerContent={registerContent}
                                key={pane.id} />
                        ))
                    }
                </SortableContext>
            </DndContext>
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
