"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  FileText, 
  Files, 
  CheckSquare, 
  Activity, 
  MessageSquare, 
  LayoutDashboard,
  Settings
} from "lucide-react";

const navItems = [
  { name: "Overview", href: "", icon: LayoutDashboard },
  { name: "Contract", href: "/contract", icon: FileText },
  { name: "Files", href: "/files", icon: Files },
  { name: "Deliverables", href: "/deliverables", icon: CheckSquare },
  { name: "Activity", href: "/activity", icon: Activity },
  { name: "Discussions", href: "/discussions", icon: MessageSquare },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function ProjectSidebar({ projectId, projectName, role }: { projectId: string, projectName: string, role: string }) {
  const pathname = usePathname();
  const basePath = `/projects/${projectId}`;

  return (
    <div className="hidden border-r bg-muted/40 md:block md:w-64 lg:w-72 flex-shrink-0 min-h-svh">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <span className="truncate">{projectName}</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navItems.map((item) => {
              const fullHref = `${basePath}${item.href}`;
              // For overview, exact match on basePath, otherwise endsWith
              const isActive = item.href === "" 
                ? pathname === fullHref 
                : pathname.startsWith(fullHref);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={fullHref}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                    isActive ? "bg-muted text-primary" : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
