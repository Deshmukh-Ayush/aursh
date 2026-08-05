"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ProfileMenu } from "./profile-menu";
import { useSidebarCollapse } from "@/hooks/use-sidebar-collapse";
import { useProjectUnreadCounts } from "@/hooks/use-project-unreadcounts";
import { mainNavItems, secondaryNavItems } from "@/config/project-sidebar-config";
import { SidebarBrand } from "./brand";
import { cn } from "@/lib/utils";
import {
  SidebarContext,
  NavItem,
  NavItemLabel,
  NavItemBadge,
} from "./nav-items";
import { CaretUpDownIcon } from "@phosphor-icons/react";

type OrgLike = {
  plan?: string | null;
  name?: string | null;
  logoUrl?: string | null;
};

type ProjectSidebarProps = {
  projectId: string;
  projectName: string;
  isMobile?: boolean;
  org?: OrgLike;
};

const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

function SectionHeader({
  isCollapsed,
  children,
}: {
  isCollapsed: boolean;
  children: React.ReactNode;
}) {
  if (isCollapsed) return null; 

  return (
    <h3 className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-tight text-foreground/60 select-none">
      {children}
    </h3>
  );
}

export function ProjectSidebar({
  projectId,
  projectName,
  isMobile = false,
  org,
}: ProjectSidebarProps) {
  const pathname = usePathname();
  const basePath = `/projects/${projectId}`;
  const { isCollapsed } = useSidebarCollapse(false);
  const { getUnreadCount } = useProjectUnreadCounts(projectId);
  const canWhitelabel = org?.plan === "agency";



  return (
    <SidebarContext.Provider value={{ isCollapsed }}>
      <aside
        aria-label="Project Sidebar"
        className={cn(
          "z-10 shrink-0 bg-background",
          isMobile
            ? "block min-h-svh w-full"
            : cn(
                "sticky top-0 hidden h-svh overflow-hidden border-r border-border/40 md:flex",
                "transition-[width] duration-200 py-2",
                isCollapsed ? "w-18" : "w-63"
              )
        )}
        style={!isMobile ? { transitionTimingFunction: EASE_OUT } : undefined}
      >
        <div className="flex h-full w-full flex-col overflow-hidden">



          {/* Header */}
          <div className="flex h-14 shrink-0 items-center justify-between gap-4 px-4 cursor-pointer">
            <SidebarBrand
              projectName={projectName}
              org={org}
              canWhitelabel={canWhitelabel}
            />
            <CaretUpDownIcon size={18} />
          </div>





          {/* Navigation Sections */}
          <nav
            aria-label="Main Navigation"
            className="custom-scrollbar flex flex-1 flex-col overflow-y-auto overflow-x-hidden px-3 py-6"
          >
            {/* Workspace Group */}
            <div>
              <SectionHeader isCollapsed={isCollapsed}>Workspace</SectionHeader>
              <ul role="list" className="space-y-0.5">
                {mainNavItems.map((item) => {
                  const Icon = item.icon;
                  const fullHref = `${basePath}${item.href}`;
                  const isActive =
                    item.href === "" ? pathname === fullHref : pathname.startsWith(fullHref);
                  const unreadCount = getUnreadCount(item.href);

                  return (
                    <li key={item.name}>
                      <NavItem asChild isActive={isActive} title={item.name}>
                        <Link href={fullHref}>
                          <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                          <NavItemLabel>{item.name}</NavItemLabel>
                          <NavItemBadge count={unreadCount} />
                        </Link>
                      </NavItem>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Secondary Group */}
            <div className="mt-6">
              <SectionHeader isCollapsed={isCollapsed}>More</SectionHeader>
              <ul role="list" className="space-y-0.5">
                {secondaryNavItems.map((item) => {
                  const Icon = item.icon;
                  const fullHref = `${basePath}${item.href}`;
                  const isActive = pathname.startsWith(fullHref);
                  const unreadCount = getUnreadCount(item.href);

                  return (
                    <li key={item.name}>
                      <NavItem asChild isActive={isActive} title={item.name}>
                        <Link href={fullHref}>
                          <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                          <NavItemLabel>{item.name}</NavItemLabel>
                          <NavItemBadge count={unreadCount} />
                        </Link>
                      </NavItem>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Logout Action */}
            <div className="mt-auto pt-4">
              <ProfileMenu />
            </div>
          </nav>

          {/* Footer Branding */}
          {!canWhitelabel && (
            <div
              className={cn(
                "shrink-0 border-t border-border/40 transition-[padding] duration-200",
                isCollapsed ? "p-2" : "px-4 py-3"
              )}
            >
              {!isCollapsed && (
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/40 select-none">
                  <span>Powered by</span>
                  <Image
                    width={80}
                    height={20}
                    src="/logo/scrunity_logo_svg.svg"
                    alt="Scrunity"
                    className="h-3 w-auto object-contain dark:invert opacity-60"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </SidebarContext.Provider>
  );
}