import React, { MouseEventHandler, ReactNode, useCallback, useEffect, useRef, useState } from "react"
import UserIcon from "./UserIcon";
import { PaneData } from "../common";
import { IpcRenderer, IpcRendererEvent } from "electron";
import RoundedButton from "./RoundedButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleLeft, faAngleRight, faArrowsRotate, faHandPointLeft, faHandPointRight, faHouse, faMagnifyingGlass, faUserGroup, faXmark } from "@fortawesome/free-solid-svg-icons";
import { faBell, faBookmark, faEnvelope, faRectangleList, faUser } from "@fortawesome/free-regular-svg-icons";

// eslint-disable-next-line no-var
declare var window: { ipcRenderer: IpcRenderer };

const PaneContentMenuItem: React.FC<{
    children?: ReactNode,
    onClick?: MouseEventHandler<HTMLButtonElement>,
    label: string
}> = ({ children, onClick, label }) => {
    return (<div className="pane-content-menu-item">
        <RoundedButton onClick={onClick}>
            {children}
        </RoundedButton>
        <div className="pane-content-menu-item-label">
            {label}
        </div>
    </div>)
};

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

    const sendCommand = useCallback((command: string, ...args: any[]) => {
        window.ipcRenderer.send(`pane-${paneId}-${command}`, ...args);
    }, [pane?.id]);

    return (
        <div className="pane" style={{ backgroundColor: pane?.themeColor }}>
            <div className="pane-header">
                <div className="pane-header-menu-button">
                    <RoundedButton onClick={() => {
                        if (!pane) return;
                        window.ipcRenderer.send(`pane-${paneId}-view-enabled`, !pane.viewEnabled);
                    }}>
                        <div className="pane-header-icon">
                            <UserIcon user={pane?.session.user} />
                        </div>
                    </RoundedButton>
                </div>
                <div className="pane-header-control">
                    <div className="pane-header-menu-button">
                        <RoundedButton onClick={() => {
                            sendCommand("back");
                        }}>
                            <FontAwesomeIcon icon={faAngleLeft} />
                        </RoundedButton>
                    </div>
                    <div className="pane-header-menu-button">
                        <RoundedButton onClick={() => {
                            sendCommand("forward");
                        }}>
                            <FontAwesomeIcon icon={faAngleRight} />
                        </RoundedButton>
                    </div>
                    <div className="pane-header-menu-button">
                        <RoundedButton onClick={() => {
                            sendCommand("refresh");
                        }}>
                            <FontAwesomeIcon icon={faArrowsRotate} />
                        </RoundedButton>
                    </div>
                    <div className="pane-header-menu-button pane-header-menu-button-right">
                        <RoundedButton onClick={() => {
                            sendCommand("close");
                        }}>
                            <FontAwesomeIcon icon={faXmark} />
                        </RoundedButton>
                    </div>
                </div>
            </div>
            <div className="pane-content" ref={paneContentRef}>
                <div className="pane-content-menu">
                    <PaneContentMenuItem label="Home" onClick={() => {
                        sendCommand("navigate", "/home");
                    }}>
                        <FontAwesomeIcon icon={faHouse} />
                    </PaneContentMenuItem>
                    <PaneContentMenuItem label="Move Left" onClick={() => {
                        sendCommand("left");
                    }}>
                        <FontAwesomeIcon icon={faHandPointLeft} />
                    </PaneContentMenuItem>
                    <PaneContentMenuItem label="Move Right" onClick={() => {
                        sendCommand("right");
                    }}>
                        <FontAwesomeIcon icon={faHandPointRight} />
                    </PaneContentMenuItem>
                    <PaneContentMenuItem label="Explore" onClick={() => {
                        sendCommand("navigate", "/explore");
                    }}>
                        <FontAwesomeIcon icon={faMagnifyingGlass} />
                    </PaneContentMenuItem>
                    <PaneContentMenuItem label="Notifications" onClick={() => {
                        sendCommand("navigate", "/notifications");
                    }}>
                        <FontAwesomeIcon icon={faBell} />
                    </PaneContentMenuItem>
                    <PaneContentMenuItem label="Messages" onClick={() => {
                        sendCommand("navigate", "/messages");
                    }}>
                        <FontAwesomeIcon icon={faEnvelope} />
                    </PaneContentMenuItem>
                    <PaneContentMenuItem label="Lists" onClick={() => {
                        if(!pane?.session.user?.screenName) return;
                        sendCommand("navigate", `/${pane.session.user.screenName}/lists`);
                    }}>
                        <FontAwesomeIcon icon={faRectangleList} />
                    </PaneContentMenuItem>
                    <PaneContentMenuItem label="Bookmarks" onClick={() => {
                        sendCommand("navigate", "/i/bookmarks");
                    }}>
                        <FontAwesomeIcon icon={faBookmark} />
                    </PaneContentMenuItem>
                    <PaneContentMenuItem label="Communities" onClick={() => {
                        if(!pane?.session.user?.screenName) return;
                        sendCommand("navigate", `/${pane.session.user.screenName}/communities`);
                    }}>
                        <FontAwesomeIcon icon={faUserGroup} />
                    </PaneContentMenuItem>
                    <PaneContentMenuItem label="Profile" onClick={() => {
                        if(!pane?.session.user?.screenName) return;
                        sendCommand("navigate", `/${pane.session.user.screenName}`);
                    }}>
                        <FontAwesomeIcon icon={faUser} />
                    </PaneContentMenuItem>
                </div>
            </div>
        </div>
    )
};

export default Pane;