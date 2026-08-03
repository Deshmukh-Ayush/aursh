"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "scrunity:sidebar-collapsed";

const subscribe = (listener: () => void) => {
    if (typeof window === "undefined") return () => {};
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
};

const getSnapshot = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY);
};

const emptySubscribe = () => () => {};

export function useSidebarCollapse(defaultValue = false) {
    const storeValue = useSyncExternalStore(subscribe, getSnapshot, () => null);
    const isCollapsed = storeValue !== null ? storeValue === "true" : defaultValue;

    const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

    const toggle = useCallback(() => {
        const next = !isCollapsed;
        try {
            localStorage.setItem(STORAGE_KEY, String(next));
            window.dispatchEvent(new Event("storage"));
        } catch {}
    }, [isCollapsed]);

    const setIsCollapsed = useCallback((value: boolean) => {
        try {
            localStorage.setItem(STORAGE_KEY, String(value));
            window.dispatchEvent(new Event("storage"));
        } catch {}
    }, []);

    return { isCollapsed, isMounted, setIsCollapsed, toggle };
}