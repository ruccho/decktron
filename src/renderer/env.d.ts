import type { DecktronApi } from "../shared/api";

declare global {
    interface Window {
        decktron: DecktronApi;
    }
}
