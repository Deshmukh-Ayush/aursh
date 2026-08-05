"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useSidebarContext } from "./nav-items";

type OrgLike = {
  name?: string | null;
  logoUrl?: string | null;
};

type SidebarBrandProps = {
  projectName: string;
  org?: OrgLike;
  canWhitelabel?: boolean;
  href?: string;
  className?: string;
};

export function SidebarBrand({
  projectName,
  org,
  canWhitelabel = false,
  className,
}: SidebarBrandProps) {
  const { isCollapsed } = useSidebarContext();

  const displayName = (canWhitelabel && org?.name) || projectName;
  const showOrgLogo = canWhitelabel && Boolean(org?.logoUrl);

  return (
    <div
      className={cn(
        "group flex min-w-0 flex-1 items-center gap-2 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isCollapsed && "justify-center",
        className
      )}
    >
      {/* Visual Back/Dashboard Indicator */}
      {/* <div
        aria-hidden="true"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-foreground/6 transition-colors group-hover:bg-foreground/10"
      >
        <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-foreground" />
      </div> */}

      {/* Screen Reader Label when Collapsed */}
      {isCollapsed ? (
        <span className="sr-only">Back to {displayName}</span>
      ) : (
        <div className="flex min-w-0 shrink-0 items-center gap-2">
          {showOrgLogo && org?.logoUrl ? (
            <Image
              src={org.logoUrl}
              alt="" 
              unoptimized 
              width={24}
              height={24}
              className="h-10 w-auto max-w-28 rounded-[3px] object-contain bg-gray-100 dark:bg-gray-200 p-0.5 dark:invert shadow-[0px_0px_0px_1px_rgba(0,0,0,0.08),0px_1px_2px_-1px_rgba(0,0,0,0.08),0px_2px_4px_0px_rgba(0,0,0,0.06)] 
  dark:shadow-[0_0_0_1px_rgba(255,255,255,0.12)]"
            />
          ) : (
            <Image
              width={24}
              height={24}
              src="/logo/scrunity_logo_svg.svg"
              alt="" 
              className="h-10 w-auto object-contain dark:invert border p-0.5"
            />
          )}

          <div className="flex min-w-0 flex-col gap-0.3">
            <span className="truncate text-[13px] font-semibold text-foreground">
            {displayName}
          </span>
          <span className="truncate text-[9px] dark:text-neutral-500">
            Project Name
          </span>
          </div>
        </div>
      )}
    </div>
  );
}