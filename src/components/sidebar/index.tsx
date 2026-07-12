"use client";
import { useRouter, usePathname } from "next/navigation";
import { useSidebarCollapse } from "@/hooks/use-sidebar-collapse";
import { useProjectUnreadCounts } from "@/hooks/use-project-unreadcounts";
import { mainNavItems, secondaryNavItems } from "@/config/project-sidebar-config";
import { SidebarNavItem } from "./nav-items";
import { SidebarBrand } from "./brand";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import Image from "next/image";
type OrgLike = {
    plan?: string | null;
    name?: string | null;
    logoUrl?: string | null;
};
type ProjectSidebarProps = {
    projectId: string;
    projectName: string;
    role: string;
    isMobile?: boolean;
    org?: OrgLike;
};
export function ProjectSidebar({
    projectId,
    projectName,
    role: _role,
    isMobile = false,
    org,
}: ProjectSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const basePath = `/projects/${projectId}`;
    const { isCollapsed, isMounted, toggle } = useSidebarCollapse(false);
    const { getUnreadCount } = useProjectUnreadCounts(projectId);
    const canWhitelabel = org?.plan === "agency";
    const handleLogout = async () => {
        await authClient.signOut();
        router.push("/sign-in");
    };
    const renderNavItem = (item: (typeof mainNavItems)[number]) => {
        const fullHref = `${basePath}${item.href}`;
        const isActive =
            item.href === ""
                ? pathname === fullHref
                : pathname.startsWith(fullHref);
        const updateCount = getUnreadCount(item.href);
        return (
            <SidebarNavItem
                key={item.name}
                item={item}
                fullHref={fullHref}
                isActive={isActive}
                isCollapsed={isCollapsed}
                showTooltip={isCollapsed && isMounted}
                updateCount={updateCount}
            />
        );
    };
    return (
        <div
            className={cn(
                "shrink-0 z-10 bg-background transition-[width] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
                isMobile
                    ? "w-full block min-h-svh"
                    : cn(
                          "hidden md:flex sticky top-0 h-svh border-r border-border/40",
                          isCollapsed ? "w-18" : "w-60",
                      ),
            )}
        >
            {" "}
            <div className="flex h-full w-full flex-col overflow-hidden">
                {" "}
                <div className="flex items-center gap-2 px-4 h-14 shrink-0 border-b border-transparent">
                    {" "}
                    <SidebarBrand
                        projectName={projectName}
                        org={org}
                        canWhitelabel={canWhitelabel}
                        isCollapsed={isCollapsed}
                    />{" "}
                    {!isMobile && !isCollapsed && (
                        <button
                            onClick={toggle}
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-150 active:scale-[0.97]"
                            title="Collapse sidebar"
                            aria-label="Collapse sidebar"
                        >
                            {" "}
                            <ChevronLeft className="h-4 w-4" />{" "}
                        </button>
                    )}{" "}
                </div>{" "}
                <div className="flex-1 overflow-x-hidden overflow-y-auto px-3 py-4 flex flex-col custom-scrollbar">
                    {" "}
                    <div className="space-y-0.5">
                        {" "}
                        {!isCollapsed && (
                            <p className="px-2.5 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.08em] mb-1.5 select-none shrink-0 transition-opacity">
                                {" "}
                                Workspace{" "}
                            </p>
                        )}{" "}
                        {mainNavItems.map(renderNavItem)}{" "}
                    </div>{" "}
                    <div className="space-y-0.5 mt-6">
                        {" "}
                        {!isCollapsed && (
                            <p className="px-2.5 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.08em] mb-1.5 select-none shrink-0 transition-opacity">
                                {" "}
                                More{" "}
                            </p>
                        )}{" "}
                        {secondaryNavItems.map(renderNavItem)}{" "}
                    </div>{" "}
                    <div className="mt-auto pt-4 space-y-1">
                        {" "}
                        <button
                            className={cn(
                                "flex h-8 items-center gap-2.5 rounded-md text-[13px] text-muted-foreground/70 hover:text-red-500 hover:bg-red-500/6 transition-colors",
                                isCollapsed
                                    ? "justify-center w-8 px-0 mx-auto"
                                    : "w-full px-2.5",
                            )}
                            onClick={handleLogout}
                            title={isCollapsed ? "Log out" : undefined}
                            aria-label="Log out"
                        >
                            {" "}
                            <LogOut className="h-3.75 w-3.75 shrink-0" />{" "}
                            {!isCollapsed && (
                                <span className="truncate">Log out</span>
                            )}{" "}
                        </button>{" "}
                    </div>{" "}
                </div>{" "}
                <div
                    className={cn(
                        "shrink-0 border-t border-border/40",
                        isCollapsed ? "p-2" : "px-4 py-3",
                    )}
                >
                    {" "}
                    <div className="flex items-center justify-between">
                        {" "}
                        {!isCollapsed && !canWhitelabel && (
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/40 select-none mx-auto">
                                {" "}
                                <span>Powered by</span>{" "}
                                <Image
                                    width={100}
                                    height={100}
                                    src="/logo/scrunity_logo_svg.svg"
                                    alt="Scrunity"
                                    className="h-3 w-auto object-contain dark:invert opacity-60"
                                />{" "}
                            </div>
                        )}{" "}
                        {!isMobile && isCollapsed && (
                            <button
                                onClick={toggle}
                                className="flex h-8 w-full items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-150 active:scale-[0.97] mx-auto"
                                title="Expand sidebar"
                                aria-label="Expand sidebar"
                            >
                                {" "}
                                <ChevronRight className="h-4 w-4" />{" "}
                            </button>
                        )}{" "}
                    </div>{" "}
                </div>{" "}
            </div>{" "}
        </div>
    );
}
