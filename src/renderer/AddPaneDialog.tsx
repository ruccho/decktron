import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition, faAt, faHouse, faLink, faMagnifyingGlass, faHashtag } from "@fortawesome/free-solid-svg-icons";
import { faBell, faBookmark, faEnvelope, faRectangleList, faUser } from "@fortawesome/free-regular-svg-icons";
import { SessionData, UserData } from "../shared/common";
import UserIcon from "./UserIcon";
import { useViewSuspension } from "./viewSuspension";

type PaneType = {
    label: string;
    icon: IconDefinition;
    // Shown when the type needs a text input.
    inputPlaceholder?: string;
    getDefaultInput?: (user?: UserData) => string;
    // Returns the URL of the pane, or undefined if it cannot be determined.
    getUrl: (input: string, user?: UserData) => string | undefined;
};

const origin = "https://x.com";

const paneTypes: PaneType[] = [
    { label: "Home", icon: faHouse, getUrl: () => `${origin}/home` },
    { label: "Notifications", icon: faBell, getUrl: () => `${origin}/notifications` },
    { label: "Mentions", icon: faAt, getUrl: () => `${origin}/notifications/mentions` },
    { label: "Explore", icon: faHashtag, getUrl: () => `${origin}/explore` },
    { label: "Messages", icon: faEnvelope, getUrl: () => `${origin}/messages` },
    { label: "Bookmarks", icon: faBookmark, getUrl: () => `${origin}/i/bookmarks` },
    {
        label: "Lists", icon: faRectangleList,
        getUrl: (input, user) => user ? `${origin}/${user.screenName}/lists` : undefined,
    },
    {
        label: "Profile", icon: faUser,
        inputPlaceholder: "Screen name",
        getDefaultInput: (user) => user?.screenName ?? "",
        getUrl: (input) => {
            const name = input.trim().replace(/^@/, "");
            return /^\w+$/.test(name) ? `${origin}/${name}` : undefined;
        },
    },
    {
        label: "Search", icon: faMagnifyingGlass,
        inputPlaceholder: "Search query",
        getUrl: (input) => input.trim() ? `${origin}/search?q=${encodeURIComponent(input.trim())}&f=live` : undefined,
    },
    {
        label: "URL", icon: faLink,
        inputPlaceholder: "https://x.com/... or /path",
        getUrl: (input) => {
            const value = input.trim();
            if (value.startsWith("/")) return `${origin}${value}`;
            try {
                return new URL(value).protocol === "https:" ? value : undefined;
            } catch {
                return undefined;
            }
        },
    },
];

const AddPaneDialog: React.FC<{
    sessions: SessionData[],
    initialSessionId: string | null,
    onClose: () => void,
}> = ({ sessions, initialSessionId, onClose }) => {
    useViewSuspension(true);

    const [sessionId, setSessionId] = useState(initialSessionId ?? sessions[0]?.id);
    const [typeIndex, setTypeIndex] = useState(0);
    const [input, setInput] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const user = sessions.find(s => s.id === sessionId)?.user;
    const type = paneTypes[typeIndex];
    const url = sessionId !== undefined ? type.getUrl(input, user) : undefined;

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    const selectType = (index: number) => {
        setTypeIndex(index);
        setInput(paneTypes[index].getDefaultInput?.(user) ?? "");
        // Focus after the input is rendered.
        setTimeout(() => inputRef.current?.focus());
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        if (sessionId === undefined || url === undefined) return;
        window.decktron.send("add-pane", sessionId, url);
        onClose();
    };

    return (
        <div className="dialog-backdrop" onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
        }}>
            <form className="dialog" onSubmit={submit}>
                <h2 className="dialog-title">Add Pane</h2>

                <div className="dialog-section-label">Account</div>
                <div className="dialog-accounts">
                    {sessions.map(session => (
                        <button
                            type="button"
                            key={session.id}
                            className={`dialog-account ${session.id === sessionId ? "selected" : ""}`}
                            onClick={() => setSessionId(session.id)}>
                            <div className="dialog-account-icon"><UserIcon user={session.user} /></div>
                            <span>{session.user ? `@${session.user.screenName}` : "Not logged in"}</span>
                        </button>
                    ))}
                </div>

                <div className="dialog-section-label">Type</div>
                <div className="dialog-types">
                    {paneTypes.map((t, index) => (
                        <button
                            type="button"
                            key={t.label}
                            className={`dialog-type ${index === typeIndex ? "selected" : ""}`}
                            onClick={() => selectType(index)}>
                            <FontAwesomeIcon icon={t.icon} />
                            <span>{t.label}</span>
                        </button>
                    ))}
                </div>

                {type.inputPlaceholder && (
                    <input
                        ref={inputRef}
                        className="dialog-input"
                        placeholder={type.inputPlaceholder}
                        value={input}
                        onChange={(event) => setInput(event.target.value)} />
                )}

                <div className="dialog-buttons">
                    <button type="button" className="dialog-button" onClick={onClose}>Cancel</button>
                    <button type="submit" className="dialog-button primary" disabled={url === undefined}>Add</button>
                </div>
            </form>
        </div>
    );
};

export default AddPaneDialog;
