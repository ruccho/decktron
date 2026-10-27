import React, { useCallback } from "react"
import UserIcon from "./UserIcon";
import { PaneData, SessionData } from "../shared/common";
import { PaneCommand } from "../shared/api";
import RoundedButton from "./RoundedButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleLeft, faAngleRight, faArrowsRotate, faBars, faXmark } from "@fortawesome/free-solid-svg-icons";
import { usePaneSnapshot } from "./viewSuspension";
import { getPaneTitle } from "./paneTitle";

const Pane: React.FC<{
    pane: PaneData,
    session?: SessionData,
    // Receives the element where the pane's page is displayed.
    registerContent: (paneId: string, element: HTMLDivElement | null) => void,
}> = ({ pane, session, registerContent }) => {
    const snapshot = usePaneSnapshot(pane.id);

    const contentRef = useCallback((element: HTMLDivElement | null) => {
        registerContent(pane.id, element);
    }, [pane.id, registerContent]);

    const sendCommand = useCallback((command: PaneCommand) => {
        window.decktron.send("pane-command", pane.id, command);
    }, [pane.id]);

    const openMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        sendCommand({ type: "open-menu", x: rect.left, y: rect.bottom });
    };

    const user = session?.user;

    return (
        <div className="pane" style={{ backgroundColor: pane.themeColor, width: pane.width }}>
            <div className="pane-header">
                <div className="pane-header-menu-button">
                    <RoundedButton onClick={openMenu} title="Menu">
                        <div className="pane-header-icon">
                            <UserIcon user={user} />
                        </div>
                    </RoundedButton>
                </div>
                <button className="pane-header-title" title="Scroll to top" onClick={() => sendCommand({ type: "scroll-to-top" })}>
                    <div className="pane-header-title-main">{getPaneTitle(pane.url)}</div>
                    <div className="pane-header-title-sub">{user ? `@${user.screenName}` : "Not logged in"}</div>
                </button>
                <div className="pane-header-menu-button">
                    <RoundedButton onClick={() => sendCommand({ type: "back" })} title="Back">
                        <FontAwesomeIcon icon={faAngleLeft} />
                    </RoundedButton>
                </div>
                <div className="pane-header-menu-button">
                    <RoundedButton onClick={() => sendCommand({ type: "forward" })} title="Forward">
                        <FontAwesomeIcon icon={faAngleRight} />
                    </RoundedButton>
                </div>
                <div className="pane-header-menu-button">
                    <RoundedButton onClick={() => sendCommand({ type: "refresh" })} title="Reload">
                        <FontAwesomeIcon icon={faArrowsRotate} />
                    </RoundedButton>
                </div>
                <div className="pane-header-menu-button">
                    <RoundedButton onClick={openMenu} title="Menu">
                        <FontAwesomeIcon icon={faBars} />
                    </RoundedButton>
                </div>
                <div className="pane-header-menu-button">
                    <RoundedButton onClick={() => sendCommand({ type: "close" })} title="Close">
                        <FontAwesomeIcon icon={faXmark} />
                    </RoundedButton>
                </div>
            </div>
            <div className="pane-content" ref={contentRef}>
                {snapshot && <img className="pane-snapshot" src={snapshot} alt="" />}
            </div>
        </div>
    )
};

export default Pane;
