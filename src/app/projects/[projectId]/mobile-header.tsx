"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { ProjectSidebar } from "@/components/sidebar/index";
import { TopbarNotifications } from "@/components/projects/topbar-notifications";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { CollapseToggle } from "@/components/sidebar/collapse-toggle"; 

type MobileHeaderOrg = {
  plan?: string;
  logoUrl?: string;
  name?: string;
};

interface MobileHeaderProps {
  projectId: string;
  projectName: string;
  role: string;
  org?: MobileHeaderOrg;
}

export function MobileHeader({ projectId, projectName, role, org }: MobileHeaderProps) {
  const [open, setOpen] = React.useState(false);
  const canWhitelabel = org?.plan === "agency";

  // Better Interface: Lock body scrolling when the mobile drawer is active
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  return (
    <>
      {/* 1. Native lightweight backdrop (replaces Sheet overlay) */}
      {open && (
        <div 
          className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 2. Native sliding drawer (replaces SheetContent) */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-background shadow-2xl transition-transform duration-300 ease-out md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Menu"
      >
        <div onClick={() => setOpen(false)} className="h-full w-full">
          {/* TypeScript Fix: Removed 'role={role}' as it does not exist on ProjectSidebarProps */}
          <ProjectSidebar 
            projectId={projectId} 
            projectName={projectName} 
            isMobile={true} 
            org={org} 
          />
        </div>
      </div>

      {/* 3. Refined Header with glassmorphism */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-border/40 bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-4">
        
        {/* Left Side: Navigation Triggers */}
        <div className="flex items-center">
          {/* Mobile: Hamburger Button */}
          <button 
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-label="Toggle navigation menu"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Desktop: Collapse Toggle (Hidden on mobile) */}
          <div className="hidden md:flex">
            <CollapseToggle />
          </div>
        </div>

        {/* Center: Branding (Visible only on mobile; desktop branding is handled in the sidebar) */}
        <div className="ml-1 flex min-w-0 flex-1 items-center md:hidden">
          {canWhitelabel && org?.logoUrl ? (
            <Image 
              height={100} 
              width={100} 
              src={org.logoUrl} 
              alt={org.name || projectName} 
              className="h-5 w-auto max-w-[120px] rounded-sm object-contain ring-1 ring-black/5 dark:ring-white/10" 
            />
          ) : (
            <div className="flex items-center gap-2">
              <Image 
                height={100} 
                width={100} 
                src="/logo/scrunity_logo_svg.svg" 
                alt="Scrunity" 
                className="h-4 w-auto object-contain dark:invert" 
              />
              <h1 className="truncate text-sm font-semibold text-foreground">
                {projectName}
              </h1>
            </div>
          )}
        </div>

        {/* Spacer to push notifications to the right on desktop */}
        <div className="hidden flex-1 md:flex" />

        {/* Right Side: Notifications */}
        <div className="flex shrink-0 items-center">
          <TopbarNotifications projectId={projectId} />
        </div>
      </header>
    </>
  );
}