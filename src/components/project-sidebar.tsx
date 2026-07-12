"use client";
import { useState, useEffect } from "react";
import useSWR from "swr";

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
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const mainNavItems = [
  { name: "Overview", href: "", icon: LayoutDashboard },
  { name: "Deliverables", href: "/deliverables", icon: CheckSquare },
  { name: "Files", href: "/files", icon: Files },
  { name: "Contract", href: "/contract", icon: FileText },
];

const secondaryNavItems = [
  { name: "Discussions", href: "/discussions", icon: MessageSquare },
  { name: "Activity", href: "/activity", icon: Activity },
  { name: "Settings", href: "/settings", icon: Settings },
];

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function getUpdateCount(notifications: any[], types: string[], projectId: string) {
  if (!notifications) return 0;
  return notifications.filter(n => 
    n.projectId === projectId && 
    !n.read && 
    types.includes(n.type)
  ).length;
}

export function ProjectSidebar({ projectId, projectName, role, isMobile = false, org }: { projectId: string, projectName: string, role: string, isMobile?: boolean, org?: any }) {
  const pathname = usePathname();
  const router = useRouter();
  const basePath = `/projects/${projectId}`;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("scrunity:sidebar-collapsed");
    if (saved) setIsCollapsed(saved === "true");
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("scrunity:sidebar-collapsed", String(newState));
  };

  const canWhitelabel = org?.plan === "agency";

  const { data: notifData } = useSWR('/api/notifications', fetcher, { 
    refreshInterval: 30000,
    revalidateOnFocus: true 
  });
  const notifications = notifData?.notifications || [];

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/sign-in");
  };

  const getUnreadCount = (href: string) => {
    switch(href) {
      case "/deliverables":
        return getUpdateCount(notifications, ["deliverable_created", "deliverable_approved", "revision_requested", "deliverable_completed", "deliverable_in_review"], projectId);
      case "/files":
        return getUpdateCount(notifications, ["file_uploaded"], projectId);
      case "/contract":
        return getUpdateCount(notifications, ["contract_uploaded", "contract_signed"], projectId);
      case "/discussions":
        return getUpdateCount(notifications, ["comment_added"], projectId);
      case "/activity":
        return getUpdateCount(notifications, ["project_completed", "member_joined"], projectId);
      default:
        return 0;
    }
  };

  const renderNavItem = (item: typeof mainNavItems[0]) => {
    const fullHref = `${basePath}${item.href}`;
    const isActive = item.href === "" 
      ? pathname === fullHref 
      : pathname.startsWith(fullHref);
    const Icon = item.icon;
    const updateCount = getUnreadCount(item.href);

    const linkContent = (
      <Link
        href={fullHref}
        className={cn(
          "flex h-8 items-center gap-2.5 rounded-md text-[13px] transition-[background-color,color] relative group",
          isCollapsed ? "justify-center w-8 px-0 mx-auto" : "px-2.5",
          isActive 
            ? "bg-foreground/[0.06] text-foreground font-medium" 
            : "text-muted-foreground/80 hover:bg-foreground/[0.04] hover:text-foreground"
        )}
      >
        <Icon className={cn("h-[15px] w-[15px] shrink-0", isActive ? "text-foreground" : "text-muted-foreground/60")} />
        
        {!isCollapsed && (
          <span className="truncate transition-opacity duration-300">{item.name}</span>
        )}
        
        {!isCollapsed && updateCount > 0 && (
          <span className="ml-auto flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white tabular-nums px-0.5 shadow-[0_1px_3px_rgba(239,68,68,0.35)]">
            {updateCount}
          </span>
        )}

        {isCollapsed && updateCount > 0 && (
          <span className="absolute top-1 right-1 flex h-[6px] w-[6px] rounded-full bg-red-500 shadow-[0_1px_3px_rgba(239,68,68,0.35)]" />
        )}

        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-foreground" />
        )}
      </Link>
    );

    if (isCollapsed && isMounted) {
      return (
        <Tooltip key={item.name} delayDuration={0}>
          <TooltipTrigger asChild>
            {linkContent}
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium text-xs bg-foreground text-background">
            {item.name}
            {updateCount > 0 && ` (${updateCount} unread)`}
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <div key={item.name}>
        {linkContent}
      </div>
    );
  };

  return (
    <div className={cn(
      "shrink-0 z-10 bg-background transition-[width] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
      isMobile 
        ? "w-full block min-h-svh" 
        : cn("hidden md:flex sticky top-0 h-svh border-r border-border/40", isCollapsed ? "w-[72px]" : "w-[240px]")
    )}>
      <div className="flex h-full w-full flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center gap-2 px-4 h-14 shrink-0 border-b border-transparent">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 min-w-0 group outline-none flex-1"
          >
            <div className={cn(
              "flex h-6 w-6 items-center justify-center rounded-md bg-foreground/[0.06] shrink-0 group-hover:bg-foreground/[0.1] transition-colors",
              isCollapsed && "mx-auto"
            )}>
              <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            {!isCollapsed && (
              canWhitelabel && org?.logoUrl ? (
                <img 
                  src={org.logoUrl} 
                  alt={org.name || projectName} 
                  className="h-5 w-auto object-contain max-w-[120px] rounded-[3px] outline outline-1 outline-black/[0.08] dark:outline-white/[0.08]" 
                />
              ) : (
                <div className="flex items-center gap-2 shrink-0">
                  <img src="/logo/scrunity_logo_svg.svg" alt="Scrunity" className="h-5 w-auto object-contain dark:invert" />
                  <span className="text-[13px] font-semibold truncate text-foreground">{projectName}</span>
                </div>
              )
            )}
          </Link>
          
          {/* Toggle Button moved to Header */}
          {!isMobile && !isCollapsed && (
            <button
              onClick={toggleSidebar}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-150 active:scale-[0.97]"
              title="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto px-3 py-4 flex flex-col custom-scrollbar">
          
          {/* Main navigation */}
          <div className="space-y-0.5">
            {!isCollapsed && (
              <p className="px-2.5 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.08em] mb-1.5 select-none shrink-0 transition-opacity">
                Workspace
              </p>
            )}
            {mainNavItems.map(renderNavItem)}
          </div>

          {/* Secondary navigation */}
          <div className="space-y-0.5 mt-6">
            {!isCollapsed && (
              <p className="px-2.5 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.08em] mb-1.5 select-none shrink-0 transition-opacity">
                More
              </p>
            )}
            {secondaryNavItems.map(renderNavItem)}
          </div>
          
          {/* Bottom actions */}
          <div className="mt-auto pt-4 space-y-1">
            <button 
              className={cn(
                "flex h-8 items-center gap-2.5 rounded-md text-[13px] text-muted-foreground/70 hover:text-red-500 hover:bg-red-500/[0.06] transition-colors",
                isCollapsed ? "justify-center w-8 px-0 mx-auto" : "w-full px-2.5"
              )}
              onClick={handleLogout}
              title={isCollapsed ? "Log out" : undefined}
            >
              <LogOut className="h-[15px] w-[15px] shrink-0" />
              {!isCollapsed && <span className="truncate">Log out</span>}
            </button>
          </div>
        </div>
        
        {/* Footer */}
        <div className={cn("shrink-0 border-t border-border/40", isCollapsed ? "p-2" : "px-4 py-3")}>
          <div className="flex items-center justify-between">
            {!isCollapsed && !canWhitelabel && (
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/40 select-none mx-auto">
                <span>Powered by</span>
                <img src="/logo/scrunity_logo_svg.svg" alt="Scrunity" className="h-3 w-auto object-contain dark:invert opacity-60" />
              </div>
            )}
            {!isMobile && isCollapsed && (
              <button
                onClick={toggleSidebar}
                className="flex h-8 w-full items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-150 active:scale-[0.97] mx-auto"
                title="Expand sidebar"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
