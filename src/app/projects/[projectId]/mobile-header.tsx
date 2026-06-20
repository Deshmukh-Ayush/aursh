"use client";

import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { ProjectSidebar } from "@/components/project-sidebar";
import { useState } from "react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export function MobileHeader({ projectId, projectName, role, org }: { projectId: string, projectName: string, role: string, org?: any }) {
  const [open, setOpen] = useState(false);
  const isPaid = org?.plan === "paid";

  return (
    <header className="md:hidden flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0 w-72">
          {/* Radix requires SheetTitle/SheetDescription for accessibility, we visually hide it if we don't want it */}
          <VisuallyHidden>
            <SheetTitle>Navigation Menu</SheetTitle>
            <SheetDescription>Navigate through the project workspace.</SheetDescription>
          </VisuallyHidden>
          {/* Pass setOpen so we can close it on navigation if we wanted, but standard Next.js navigation might reset it anyway. */}
          <div onClick={() => setOpen(false)} className="h-full">
            <ProjectSidebar projectId={projectId} projectName={projectName} role={role} isMobile={true} org={org} />
          </div>
        </SheetContent>
      </Sheet>
      <div className="flex-1">
        {isPaid && org?.logoUrl ? (
          <img src={org.logoUrl} alt={org.name || projectName} className="h-6 object-contain max-w-[150px]" />
        ) : (
          <h1 className="font-semibold truncate">{projectName}</h1>
        )}
      </div>
    </header>
  );
}
