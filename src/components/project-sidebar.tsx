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
  Settings,
  ArrowLeft,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

const navItems = [
  { name: "Overview", href: "", icon: LayoutDashboard },
  { name: "Contract", href: "/contract", icon: FileText },
  { name: "Files", href: "/files", icon: Files },
  { name: "Deliverables", href: "/deliverables", icon: CheckSquare },
  { name: "Activity", href: "/activity", icon: Activity },
  { name: "Discussions", href: "/discussions", icon: MessageSquare },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function ProjectSidebar({ projectId, projectName, role, isMobile = false, org }: { projectId: string, projectName: string, role: string, isMobile?: boolean, org?: any }) {
  const pathname = usePathname();
  const router = useRouter();
  const basePath = `/projects/${projectId}`;

  const isPaid = org?.plan === "paid";

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/sign-in");
  };

  return (
    <div className={cn("bg-muted/40 flex-shrink-0 min-h-svh", isMobile ? "w-full border-r-0 block" : "hidden border-r md:block md:w-64 lg:w-72")}>
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            {isPaid && org?.logoUrl ? (
              <img src={org.logoUrl} alt={org.name || projectName} className="h-6 object-contain max-w-[150px]" />
            ) : (
              <span className="truncate">{projectName}</span>
            )}
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2 flex flex-col">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4 mb-4 space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
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
          
          <div className="mt-auto px-2 lg:px-4 mb-4">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </Button>
          </div>
        </div>
        
        {!isPaid && (
          <div className="p-4 mt-auto border-t">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span>Powered by</span>
              <span className="font-semibold text-foreground">Aursh</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
