import React, { MouseEventHandler, ReactNode, useCallback, useRef } from "react"
import UserIcon from "./UserIcon";
import { PaneData } from "../shared/common";
import { PaneCommand } from "../shared/api";
import RoundedButton from "./RoundedButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleLeft, faAngleRight, faArrowsRotate, faFeather, faFileLines, faGear, faHandPointLeft, faHandPointRight, faHouse, faMagnifyingGlass, faUserGroup, faXmark } from "@fortawesome/free-solid-svg-icons";
import { faBell, faBookmark, faEnvelope, faRectangleList, faUser } from "@fortawesome/free-regular-svg-icons";

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
    pane: PaneData
}> = ({ pane }) => {
    const paneContentRef = useRef(null);

    const sendCommand = useCallback((command: PaneCommand) => {
        window.decktron.send("pane-command", pane.id, command);
    }, [pane.id]);

    return (
        <div className="pane" style={{ backgroundColor: pane.themeColor }}>
            <div className="pane-header">
                <div className="pane-header-menu-button">
                    <RoundedButton onClick={() => {
                        sendCommand({ type: "set-view-enabled", enabled: !pane.viewEnabled });
                    }}>
                        <div className="pane-header-icon">
                            <UserIcon user={pane.session.user} />
                        </div>
                    </RoundedButton>
                </div>
                <div className="pane-header-control">
                    <div className="pane-header-menu-button">
                        <RoundedButton onClick={() => {
                            sendCommand({ type: "back" });
                        }}>
                            <FontAwesomeIcon icon={faAngleLeft} />
                        </RoundedButton>
                    </div>
                    <div className="pane-header-menu-button">
                        <RoundedButton onClick={() => {
                            sendCommand({ type: "forward" });
                        }}>
                            <FontAwesomeIcon icon={faAngleRight} />
                        </RoundedButton>
                    </div>
                    <div className="pane-header-menu-button">
                        <RoundedButton onClick={() => {
                            sendCommand({ type: "refresh" });
                        }}>
                            <FontAwesomeIcon icon={faArrowsRotate} />
                        </RoundedButton>
                    </div>
                    <div className="pane-header-menu-button pane-header-menu-button-right">
                        <RoundedButton onClick={() => {
                            sendCommand({ type: "close" });
                        }}>
                            <FontAwesomeIcon icon={faXmark} />
                        </RoundedButton>
                    </div>
                </div>
            </div>
            <div className="pane-content" ref={paneContentRef}>
                <div className="pane-content-menu">
                    <PaneContentMenuItem label="Post" onClick={() => {
                        sendCommand({ type: "navigate", path: `/compose/tweet` });
                    }}>
                        <FontAwesomeIcon icon={faFeather} />
                    </PaneContentMenuItem>
                    <PaneContentMenuItem label="Move Left" onClick={() => {
                        sendCommand({ type: "move", shift: -1 });
                    }}>
                        <FontAwesomeIcon icon={faHandPointLeft} />
                    </PaneContentMenuItem>
                    <PaneContentMenuItem label="Move Right" onClick={() => {
                        sendCommand({ type: "move", shift: 1 });
                    }}>
                        <FontAwesomeIcon icon={faHandPointRight} />
                    </PaneContentMenuItem>
                    <PaneContentMenuItem label="Home" onClick={() => {
                        sendCommand({ type: "navigate", path: "/home" });
                    }}>
                        <FontAwesomeIcon icon={faHouse} />
                    </PaneContentMenuItem>
                    <PaneContentMenuItem label="Explore" onClick={() => {
                        sendCommand({ type: "navigate", path: "/explore" });
                    }}>
                        <FontAwesomeIcon icon={faMagnifyingGlass} />
                    </PaneContentMenuItem>
                    <PaneContentMenuItem label="Notifications" onClick={() => {
                        sendCommand({ type: "navigate", path: "/notifications" });
                    }}>
                        <FontAwesomeIcon icon={faBell} />
                    </PaneContentMenuItem>
                    <PaneContentMenuItem label="Messages" onClick={() => {
                        sendCommand({ type: "navigate", path: "/messages" });
                    }}>
                        <FontAwesomeIcon icon={faEnvelope} />
                    </PaneContentMenuItem>
                    <PaneContentMenuItem label="Lists" onClick={() => {
                        if(!pane.session.user?.screenName) return;
                        sendCommand({ type: "navigate", path: `/${pane.session.user.screenName}/lists` });
                    }}>
                        <FontAwesomeIcon icon={faRectangleList} />
                    </PaneContentMenuItem>
                    <PaneContentMenuItem label="Bookmarks" onClick={() => {
                        sendCommand({ type: "navigate", path: "/i/bookmarks" });
                    }}>
                        <FontAwesomeIcon icon={faBookmark} />
                    </PaneContentMenuItem>
                    <PaneContentMenuItem label="Communities" onClick={() => {
                        if(!pane.session.user?.screenName) return;
                        sendCommand({ type: "navigate", path: `/${pane.session.user.screenName}/communities` });
                    }}>
                        <FontAwesomeIcon icon={faUserGroup} />
                    </PaneContentMenuItem>
                    <PaneContentMenuItem label="Profile" onClick={() => {
                        if(!pane.session.user?.screenName) return;
                        sendCommand({ type: "navigate", path: `/${pane.session.user.screenName}` });
                    }}>
                        <FontAwesomeIcon icon={faUser} />
                    </PaneContentMenuItem>
                    <PaneContentMenuItem label="Settings" onClick={() => {
                        sendCommand({ type: "navigate", path: `/settings` });
                    }}>
                        <FontAwesomeIcon icon={faGear} />
                    </PaneContentMenuItem>
                    <PaneContentMenuItem label="Drafts" onClick={() => {
                        sendCommand({ type: "navigate", path: `/compose/tweet/unsent/drafts` });
                    }}>
                        <FontAwesomeIcon icon={faFileLines} />
                    </PaneContentMenuItem>
                </div>
            </div>
        </div>
    )
};

export default Pane;