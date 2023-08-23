export type PaneData = {
    id: string;
    session: SessionData;
    canGoBack: boolean;
    canGoForward: boolean;

};

export type SessionData = {
    id: string;
    user?: UserData;
}

export type UserData = {
    id: string;
    screenName: string;
    displayName: string;
    profileImageUrl: string;
}