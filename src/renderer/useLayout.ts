import { useEffect, useState } from "react";
import { LayoutData } from "../shared/common";

export function useLayout(): LayoutData {
    const [layout, setLayout] = useState<LayoutData>({ sessions: [], panes: [] });

    useEffect(() => {
        const unsubscribe = window.decktron.on("layout", setLayout);
        window.decktron.send("request-layout");
        return unsubscribe;
    }, []);

    return layout;
}
