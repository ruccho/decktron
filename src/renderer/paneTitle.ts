const fixedTitles: Record<string, string> = {
    "/home": "Home",
    "/explore": "Explore",
    "/notifications": "Notifications",
    "/notifications/mentions": "Mentions",
    "/messages": "Messages",
    "/i/bookmarks": "Bookmarks",
    "/settings": "Settings",
};

// Returns a short title that describes the page displayed in a pane.
export function getPaneTitle(url: string): string {
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        return url;
    }

    if (parsed.host !== "x.com") return parsed.host;

    const path = parsed.pathname.replace(/\/$/, "");
    if (fixedTitles[path]) return fixedTitles[path];

    if (path === "/search") {
        const query = parsed.searchParams.get("q");
        return query ? `Search: ${query}` : "Search";
    }
    if (path.startsWith("/explore/")) return "Explore";
    if (path.startsWith("/settings/")) return "Settings";
    if (path.startsWith("/messages/")) return "Messages";
    if (path.startsWith("/i/lists/")) return "List";
    if (path.startsWith("/i/communities/")) return "Community";

    const segments = path.split("/").filter(s => s.length > 0);
    if (segments.length === 0) return "X";
    if (segments[0] === "i") return "X";
    if (segments.length >= 3 && segments[1] === "status") return "Post";
    if (segments.length >= 2 && segments[1] === "lists") return `Lists of @${segments[0]}`;
    return `@${segments[0]}`;
}
