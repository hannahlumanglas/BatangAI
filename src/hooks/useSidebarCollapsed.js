import { useEffect, useState } from 'react';

const SIDEBAR_COLLAPSED_KEY = 'batangai-sidebar-collapsed';

export function useSidebarCollapsed() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true');

    useEffect(() => {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
    }, [sidebarCollapsed]);

    return [sidebarCollapsed, setSidebarCollapsed];
}
