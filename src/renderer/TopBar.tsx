import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faUserPlus } from "@fortawesome/free-solid-svg-icons";
import { SessionData } from "../shared/common";
import UserIcon from "./UserIcon";
import ClosedPaneNotice from "./ClosedPaneNotice";

const TopBar: React.FC<{
    sessions: SessionData[],
    onAddPane: () => void,
}> = ({ sessions, onAddPane }) => {
    return (
        <div className="top-bar">
            <button className="top-bar-button primary" onClick={onAddPane} title="Add pane">
                <FontAwesomeIcon icon={faPlus} />
                <span>Add Pane</span>
            </button>
            <div className="top-bar-separator" />
            {sessions.map(session => (
                <button
                    key={session.id}
                    className="top-bar-account"
                    title={session.user ? `@${session.user.screenName}` : "Not logged in"}
                    onClick={(event) => {
                        const rect = event.currentTarget.getBoundingClientRect();
                        window.decktron.send("open-session-menu", session.id, rect.left, rect.bottom);
                    }}>
                    <UserIcon user={session.user} />
                </button>
            ))}
            <button className="top-bar-button" onClick={() => window.decktron.send("add-account")} title="Add account">
                <FontAwesomeIcon icon={faUserPlus} />
            </button>
            <ClosedPaneNotice />
        </div>
    );
};

export default TopBar;
