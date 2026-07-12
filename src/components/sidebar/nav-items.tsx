"use client";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
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

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const labelMotionProps = {
    initial: { opacity: 0, x: -4 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -4 },
    transition: { duration: 0.15, ease: EASE_OUT },
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
    const shouldReduceMotion = useReducedMotion();

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
            <Icon
                className={cn(
                    "h-3.75 w-3.75 shrink-0",
                    isActive ? "text-foreground" : "text-muted-foreground",
                )}
            />

            <AnimatePresence initial={false}>
                {!isCollapsed && (
                    <motion.span {...labelMotionProps} className="truncate">
                        {item.name}
                    </motion.span>
                )}
            </AnimatePresence>

            <AnimatePresence initial={false}>
                {!isCollapsed && updateCount > 0 && (
                    <motion.span
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.15, ease: EASE_OUT }}
                        className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white tabular-nums px-0.5 shadow-[0_1px_3px_rgba(239,68,68,0.35)]"
                    >
                        {updateCount}
                    </motion.span>
                )}
            </AnimatePresence>

            {isCollapsed && updateCount > 0 && (
                <span className="absolute top-1 right-1 flex h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_1px_3px_rgba(239,68,68,0.35)]" />
            )}

            {isActive && (
                <motion.span
                    layoutId="nav-active-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-4 rounded-r-full bg-foreground"
                    transition={
                        shouldReduceMotion
                            ? { duration: 0 }
                            : { type: "spring", duration: 0.3, bounce: 0.15 }
                    }
                />
            )}
        </Link>
    );

    if (showTooltip) {
        return (
            <Tooltip key={item.name} delayDuration={0}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent
                    side="right"
                    className="font-medium text-xs bg-foreground text-background"
                >
                    {item.name} {updateCount > 0 && ` (${updateCount} unread)`}
                </TooltipContent>
            </Tooltip>
        );
    }

    return <div key={item.name}>{linkContent}</div>;
}