import Pane from "./Pane";
import { useEffect, useRef, useState } from "react";
import { PaneData } from "../shared/common";

const PaneContainer: React.FC = () => {

    const paneContainer = useRef<HTMLDivElement>(null);

    const [panes, setPanes] = useState<PaneData[]>([]);

    useEffect(() => {
        const unsubscribe = window.decktron.on("panes", (panes) => {
            setPanes(panes);
        });
        window.decktron.send("request-panes");

        return unsubscribe;
    }, [])

    useEffect(() => {

        if (!paneContainer.current) return;

        const paneContainerCurrent = paneContainer.current;

        const resizeObserver = new ResizeObserver(() => {
            const width = paneContainerCurrent.clientWidth;
            const height = paneContainerCurrent.clientHeight;
            window.decktron.send("container-size", { width: width, height: height - 50 });
        });
        resizeObserver.observe(paneContainerCurrent);

        const onScroll = () => {
            window.decktron.send("container-offset", { x: -paneContainerCurrent.scrollLeft, y: 50 - paneContainerCurrent.scrollTop });
        };

        paneContainerCurrent.addEventListener("scroll", onScroll);

        // Horizontal wheel input forwarded from panes, in physical pixels.
        const unsubscribeWheel = window.decktron.on("wheel-horizontal", (delta) => {
            paneContainerCurrent.scrollBy({ left: delta / window.devicePixelRatio, behavior: "instant" });
        });

        return () => {
            resizeObserver.unobserve(paneContainerCurrent);
            paneContainerCurrent.removeEventListener("scroll", onScroll);
            unsubscribeWheel();
        }

    }, []);

    window.decktron.send("container-offset", { x: 0, y: 50 });

    return (
        <div className="pane-container" ref={paneContainer}>
            {
                panes.map(pane => (
                    <Pane pane={pane} key={pane.id} />
                ))
            }
        </div>
    )
};

export default PaneContainer;