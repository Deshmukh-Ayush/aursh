"use client";
import useSWR from "swr";
import { unreadTypeMap } from "@/config/project-sidebar-config";
type Notification = { projectId: string; read: boolean; type: string };
type NotificationsResponse = { notifications?: Notification[] };
const fetcher = async (url: string): Promise<NotificationsResponse> => {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error("Failed to fetch notifications");
    }
    return res.json();
};
function countUnread(
    notifications: Notification[],
    types: string[],
    projectId: string,
) {
    return notifications.filter(
        (n) => n.projectId === projectId && !n.read && types.includes(n.type),
    ).length;
}
export function useProjectUnreadCounts(projectId: string) {
    const { data } = useSWR<NotificationsResponse>(
        "/api/notifications",
        fetcher,
        { refreshInterval: 30000, revalidateOnFocus: true },
    );
    const notifications = data?.notifications ?? [];
    const getUnreadCount = (href: string) => {
        const types = unreadTypeMap[href];
        if (!types) return 0;
        return countUnread(notifications, types, projectId);
    };
    return { notifications, getUnreadCount };
}
