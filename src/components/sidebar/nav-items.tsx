"use client";
import Link from "next/link";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/config/project-sidebar-config";
type SidebarNavItemProps = {
    item: NavItem;
    fullHref: string;
    isActive: boolean;
    isCollapsed: boolean;
    showTooltip: boolean;
    updateCount: number;
};
export function SidebarNavItem({
    item,
    fullHref,
    isActive,
    isCollapsed,
    showTooltip,
    updateCount,
}: SidebarNavItemProps) {
    const Icon = item.icon;
    const linkContent = (
        <Link
            href={fullHref}
            aria-current={isActive ? "page" : undefined}
            className={cn(
                "flex h-8 items-center gap-2.5 rounded-md text-[13px] transition-[background-color,color] relative group",
                isCollapsed ? "justify-center w-8 px-0 mx-auto" : "px-2.5",
                isActive
                    ? "bg-foreground/6 text-foreground font-medium"
                    : "text-muted-foreground/80 hover:bg-foreground/4 hover:text-foreground",
            )}
        >
            {" "}
            <Icon
                className={cn(
                    "h-3.75 w-3.75 shrink-0",
                    isActive ? "text-foreground" : "text-muted-foreground/60",
                )}
            />{" "}
            {!isCollapsed && (
                <span className="truncate transition-opacity duration-300">
                    {" "}
                    {item.name}{" "}
                </span>
            )}{" "}
            {!isCollapsed && updateCount > 0 && (
                <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white tabular-nums px-0.5 shadow-[0_1px_3px_rgba(239,68,68,0.35)]">
                    {" "}
                    {updateCount}{" "}
                </span>
            )}{" "}
            {isCollapsed && updateCount > 0 && (
                <span className="absolute top-1 right-1 flex h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_1px_3px_rgba(239,68,68,0.35)]" />
            )}{" "}
            {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-4 rounded-r-full bg-foreground" />
            )}{" "}
        </Link>
    );
    if (showTooltip) {
        return (
            <Tooltip key={item.name} delayDuration={0}>
                {" "}
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>{" "}
                <TooltipContent
                    side="right"
                    className="font-medium text-xs bg-foreground text-background"
                >
                    {" "}
                    {item.name} {updateCount > 0 && ` (${updateCount} unread)`}{" "}
                </TooltipContent>{" "}
            </Tooltip>
        );
    }
    return <div key={item.name}>{linkContent}</div>;
}
