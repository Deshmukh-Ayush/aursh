"use client";
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
  LogOut
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

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

  const isPaid = org?.plan === "paid";

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

    return (
      <Link
        key={item.name}
        href={fullHref}
        className={cn(
          "flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] transition-[background-color,color] relative group",
          isActive 
            ? "bg-foreground/[0.06] text-foreground font-medium" 
            : "text-muted-foreground/80 hover:bg-foreground/[0.04] hover:text-foreground"
        )}
      >
        <Icon className={cn("h-[15px] w-[15px] shrink-0", isActive ? "text-foreground" : "text-muted-foreground/60")} />
        <span className="truncate">{item.name}</span>
        {updateCount > 0 && (
          <span className="ml-auto flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white tabular-nums px-0.5 shadow-[0_1px_3px_rgba(239,68,68,0.35)]">
            {updateCount}
          </span>
        )}
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-foreground" />
        )}
      </Link>
    );
  };

  return (
    <div className={cn(
      "shrink-0 z-10 bg-background",
      isMobile 
        ? "w-full block min-h-svh" 
        : "hidden md:flex md:w-[220px] lg:w-[240px] sticky top-0 h-svh border-r border-border/40"
    )}>
      <div className="flex h-full w-full flex-col">
        
        {/* Header */}
        <div className="flex items-center gap-2 px-4 h-14 shrink-0">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 min-w-0 group"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground/[0.06] shrink-0 group-hover:bg-foreground/[0.1] transition-colors">
              <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            {isPaid && org?.logoUrl ? (
              <img 
                src={org.logoUrl} 
                alt={org.name || projectName} 
                className="h-5 w-auto object-contain max-w-[120px] rounded-[3px] outline outline-1 outline-black/[0.08] dark:outline-white/[0.08]" 
              />
            ) : (
              <span className="text-[13px] font-semibold truncate text-foreground">{projectName}</span>
            )}
          </Link>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-auto px-3 py-2 flex flex-col">
          
          {/* Main navigation */}
          <div className="space-y-0.5">
            <p className="px-2.5 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.08em] mb-1.5 select-none">
              Workspace
            </p>
            {mainNavItems.map(renderNavItem)}
          </div>

          {/* Secondary navigation */}
          <div className="space-y-0.5 mt-6">
            <p className="px-2.5 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.08em] mb-1.5 select-none">
              More
            </p>
            {secondaryNavItems.map(renderNavItem)}
          </div>
          
          {/* Bottom actions */}
          <div className="mt-auto pt-4 space-y-1">
            <button 
              className="flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-[13px] text-muted-foreground/70 hover:text-red-500 hover:bg-red-500/[0.06] transition-colors"
              onClick={handleLogout}
            >
              <LogOut className="h-[15px] w-[15px] shrink-0" />
              <span>Log out</span>
            </button>
          </div>
        </div>
        
        {/* Footer */}
        {!isPaid && (
          <div className="px-4 py-3 shrink-0">
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/40 select-none">
              <span>Powered by</span>
              <span className="font-semibold text-muted-foreground/60">Scrunity</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
