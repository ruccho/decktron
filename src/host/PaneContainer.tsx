import { IpcRenderer, IpcRendererEvent } from "electron";
import Pane from "./Pane";
import { useEffect, useRef, useState } from "react";

// eslint-disable-next-line no-var
declare var window: { ipcRenderer: IpcRenderer };

const PaneContainer: React.FC = () => {

    const paneContainer = useRef<HTMLDivElement>(null);

    const [paneIds, setPaneIds] = useState<string[]>([]);

    useEffect(() => {
        const channel = "pane-ids";
        const callback: (event: IpcRendererEvent, ...args: any[]) => void = (event, ids) => {
            console.log(ids);
            setPaneIds(ids);
        };
        window.ipcRenderer.on(channel, callback);
        window.ipcRenderer.send(channel);

        return () => {
            window.ipcRenderer.off(channel, callback);
        }
    }, [])

    useEffect(() => {

        if (!paneContainer.current) return;

        const paneContainerCurrent = paneContainer.current;

        const resizeObserver = new ResizeObserver(() => {
            const width = paneContainerCurrent.clientWidth;
            const height = paneContainerCurrent.clientHeight;
            window.ipcRenderer.send("container-size", { width: width, height: height - 50 });
        });
        resizeObserver.observe(paneContainerCurrent);

        const onScroll = () => {
            window.ipcRenderer.send("container-offset", { x: -paneContainerCurrent.scrollLeft, y: 50 - paneContainerCurrent.scrollTop });
        };

        paneContainerCurrent.addEventListener("scroll", onScroll);

        return () => {
            resizeObserver.unobserve(paneContainerCurrent);
            paneContainerCurrent.removeEventListener("scroll", onScroll);
        }

    }, [paneContainer.current]);

    window.ipcRenderer.send("container-offset", { x: 0, y: 50 });

    return (
        <div className="pane-container" ref={paneContainer}>
            {
                paneIds.map(id => (
                    <Pane paneId={id} key={id} />
                ))
            }
        </div>
    )
};

export default PaneContainer;