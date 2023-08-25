import React, { useEffect, useRef, useState } from "react"
import UserIcon from "./UserIcon";
import { PaneData } from "../common";
import { IpcRenderer, IpcRendererEvent } from "electron";
import RoundedButton from "./RoundedButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowsRotate } from "@fortawesome/free-solid-svg-icons";

// eslint-disable-next-line no-var
declare var window: { ipcRenderer: IpcRenderer };

const Pane: React.FC<{
    paneId: string
}> = ({ paneId }) => {

    const paneContentRef = useRef(null);
    const [pane, setPane] = useState<PaneData | null>(null);

    useEffect(() => {
        const channel = `pane-data-${paneId}`;
        const callback: (event: IpcRendererEvent, ...args: any[]) => void = (event, pane) => {
            setPane(pane);
        };

        window.ipcRenderer.on(channel, callback);
        window.ipcRenderer.send(channel);

        return () => {
            window.ipcRenderer.off(channel, callback);
        }
    }, [paneId]);

    return (
        <div className="pane">
            <div className="pane-header">
                <div className="pane-header-icon">
                    <UserIcon user={pane?.session.user} />
                </div>
                <div className="pane-header-control">
                    <div className="pane-header-menu-button">
                        <RoundedButton onClick={() => {
                            window.ipcRenderer.send(`pane-${paneId}-refresh`);
                        }}>
                            <FontAwesomeIcon icon={faArrowsRotate} />
                        </RoundedButton>
                    </div>
                </div>
                <div className="pane-header-menu-button">

                </div>

            </div>
            <div className="pane-content" ref={paneContentRef}>

            </div>
        </div>
    )
};

export default Pane;