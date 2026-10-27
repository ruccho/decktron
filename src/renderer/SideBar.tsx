import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faUserPlus } from "@fortawesome/free-solid-svg-icons";
import { SessionData } from "../shared/common";
import UserIcon from "./UserIcon";
import ClosedPaneNotice from "./ClosedPaneNotice";

const SideBar: React.FC<{
    sessions: SessionData[],
    onAddPane: () => void,
}> = ({ sessions, onAddPane }) => {
    return (
        <div className="side-bar">
            <button className="side-bar-button primary" onClick={onAddPane} title="Add pane">
                <FontAwesomeIcon icon={faPlus} />
            </button>
            <div className="side-bar-separator" />
            {sessions.map(session => (
                <button
                    key={session.id}
                    className="side-bar-account"
                    title={session.user ? `@${session.user.screenName}` : "Not logged in"}
                    onClick={(event) => {
                        const rect = event.currentTarget.getBoundingClientRect();
                        window.decktron.send("open-session-menu", session.id, rect.right, rect.top);
                    }}>
                    <UserIcon user={session.user} />
                </button>
            ))}
            <button className="side-bar-button" onClick={() => window.decktron.send("add-account")} title="Add account">
                <FontAwesomeIcon icon={faUserPlus} />
            </button>
            <ClosedPaneNotice />
        </div>
    );
};

export default SideBar;
