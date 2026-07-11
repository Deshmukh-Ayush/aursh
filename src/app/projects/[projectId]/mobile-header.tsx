"use client";

import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { ProjectSidebar } from "@/components/project-sidebar";
import { useState } from "react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { TopbarNotifications } from "@/components/projects/topbar-notifications";

export function MobileHeader({ projectId, projectName, role, org }: { projectId: string, projectName: string, role: string, org?: any }) {
  const [open, setOpen] = useState(false);
  const canWhitelabel = org?.plan === "agency";

  return (
    <header className="flex h-12 items-center gap-3 border-b border-border/40 bg-background px-3 md:px-4">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground/[0.04] hover:bg-foreground/[0.08] transition-colors shrink-0 md:hidden active:scale-[0.95]">
            <Menu className="h-4 w-4 text-muted-foreground" />
            <span className="sr-only">Toggle navigation menu</span>
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0 w-[260px]">
          <VisuallyHidden>
            <SheetTitle>Navigation Menu</SheetTitle>
            <SheetDescription>Navigate through the project workspace.</SheetDescription>
          </VisuallyHidden>
          <div onClick={() => setOpen(false)} className="h-full">
            <ProjectSidebar projectId={projectId} projectName={projectName} role={role} isMobile={true} org={org} />
          </div>
        </SheetContent>
      </Sheet>
      <div className="flex-1 md:hidden min-w-0">
        {canWhitelabel && org?.logoUrl ? (
          <img src={org.logoUrl} alt={org.name || projectName} className="h-5 object-contain max-w-[120px] rounded-[3px] outline outline-1 outline-black/[0.08] dark:outline-white/[0.08]" />
        ) : (
          <div className="flex items-center gap-2">
            <img src="/logo/scrunity_logo_svg.svg" alt="Scrunity" className="h-4 w-auto object-contain dark:invert" />
            <h1 className="text-[13px] font-semibold truncate">{projectName}</h1>
          </div>
        )}
      </div>
      <div className="hidden md:flex flex-1" />
      <TopbarNotifications projectId={projectId} />
    </header>
  );
}
