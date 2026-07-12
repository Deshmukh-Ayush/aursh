"use client";

import { useRouter, usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { useSidebarCollapse } from "@/hooks/use-sidebar-collapse";
import { useProjectUnreadCounts } from "@/hooks/use-project-unreadcounts";
import { mainNavItems, secondaryNavItems } from "@/config/project-sidebar-config";
import { SidebarNavItem } from "./nav-items";
import { SidebarBrand } from "./brand";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { ChevronLeft, LogOut } from "lucide-react";
import Image from "next/image";
import React from "react";

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

const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

function CollapsibleLabel({
  isCollapsed,
  className,
  children,
}: {
  isCollapsed: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "overflow-hidden whitespace-nowrap transition-[opacity,max-width] duration-200",
        isCollapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-40",
        className,
      )}
      style={{ transitionTimingFunction: EASE_OUT }}
    >
      {children}
    </span>
  );
}

export function ProjectSidebar({
  projectId,
  projectName,
  isMobile = false,
  org,
}: ProjectSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const basePath = `/projects/${projectId}`;
  const { isCollapsed, isMounted, toggle } = useSidebarCollapse(false);
  const { getUnreadCount } = useProjectUnreadCounts(projectId);
  const canWhitelabel = org?.plan === "agency";
  const shouldReduceMotion = useReducedMotion();

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/sign-in");
  };

  const renderNavItem = (item: (typeof mainNavItems)[number]) => {
    const fullHref = `${basePath}${item.href}`;
    const isActive =
      item.href === "" ? pathname === fullHref : pathname.startsWith(fullHref);

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
        "shrink-0 z-10 bg-background",
        isMobile
          ? "w-full block min-h-svh"
          : cn(
              "hidden md:flex sticky top-0 h-svh border-r border-border/40 overflow-hidden",
              "transition-[width] duration-200",
              isCollapsed ? "w-18" : "w-60",
            ),
      )}
      style={!isMobile ? { transitionTimingFunction: EASE_OUT } : undefined}
    >
      <div className="flex h-full w-full flex-col overflow-hidden">
        {/* Top header: brand + fixed toggle button */}
        <div className="flex items-center justify-between gap-7 px-4 h-14 shrink-0 border-b border-transparent">
          <SidebarBrand
            projectName={projectName}
            org={org}
            canWhitelabel={canWhitelabel}
            isCollapsed={isCollapsed}
          />

          {!isMobile && (
            <button
              onClick={toggle}
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                "hover:bg-muted text-muted-foreground hover:text-foreground",
                "transition-[background-color,color,transform] duration-150 active:scale-[0.97]",
              )}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <motion.span
                animate={{ rotate: shouldReduceMotion ? 0 : isCollapsed ? 180 : 0 }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              >
                <ChevronLeft className="h-4 w-4" />
              </motion.span>
            </button>
          )}
        </div>

        <div className="flex-1 overflow-x-hidden overflow-y-auto px-3 py-4 flex flex-col custom-scrollbar">
          <div className="space-y-0.5">
            <CollapsibleLabel
              isCollapsed={isCollapsed}
              className="block px-2.5 text-[10px] font-semibold text-foreground/80 uppercase tracking-[0.08em] mb-1.5 select-none"
            >
              Workspace
            </CollapsibleLabel>
            {mainNavItems.map(renderNavItem)}
          </div>

          <div className="space-y-0.5 mt-6">
            <CollapsibleLabel
              isCollapsed={isCollapsed}
              className="block px-2.5 text-[10px] font-semibold text-foreground/80 uppercase tracking-[0.08em] mb-1.5 select-none"
            >
              More
            </CollapsibleLabel>
            {secondaryNavItems.map(renderNavItem)}
          </div>

          <div className="mt-auto pt-4 space-y-1">
            <button
              className={cn(
                "flex h-8 items-center gap-2.5 rounded-md text-[13px] text-muted-foreground/70",
                "hover:text-red-500 hover:bg-red-500/6 transition-colors active:scale-[0.97]",
                isCollapsed
                  ? "justify-center w-8 px-0 mx-auto"
                  : "w-full px-2.5",
              )}
              onClick={handleLogout}
              title={isCollapsed ? "Log out" : undefined}
              aria-label="Log out"
            >
              <LogOut className="h-3.75 w-3.75 shrink-0" />
              <CollapsibleLabel isCollapsed={isCollapsed} className="truncate">
                Log out
              </CollapsibleLabel>
            </button>
          </div>
        </div>

        <div
          className={cn(
            "shrink-0 border-t border-border/40 transition-[padding] duration-200",
            isCollapsed ? "p-2" : "px-4 py-3",
          )}
          style={{ transitionTimingFunction: EASE_OUT }}
        >
          <div className="flex items-center justify-between">
            {!canWhitelabel && (
              <CollapsibleLabel
                isCollapsed={isCollapsed}
                className="flex items-center gap-1.5 text-[10px] text-muted-foreground/40 select-none mx-auto"
              >
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  <span>Powered by</span>
                  <Image
                    width={100}
                    height={100}
                    src="/logo/scrunity_logo_svg.svg"
                    alt="Scrunity"
                    className="h-3 w-auto object-contain dark:invert opacity-60"
                  />
                </span>
              </CollapsibleLabel>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}