import { paneWidthLimits, UserData } from "../shared/common";

export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

export function isFiniteNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
}

export function clampPaneWidth(width: number) {
    return Math.round(Math.min(paneWidthLimits.max, Math.max(paneWidthLimits.min, width)));
}

export function clampPaneZoom(zoom: number) {
    return Math.min(2, Math.max(0.25, zoom));
}

export function parseUser(value: unknown): UserData | undefined {
    if (!isRecord(value)) return;
    const { id, screenName, displayName, profileImageUrl } = value;
    if (typeof id !== "string" || typeof screenName !== "string"
        || typeof displayName !== "string" || typeof profileImageUrl !== "string") return;
    return { id, screenName, displayName, profileImageUrl };
}
