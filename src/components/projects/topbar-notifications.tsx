"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import useSWR from "swr";
import { useRouter } from "next/navigation";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function TopbarNotifications({ projectId }: { projectId: string }) {
  const router = useRouter();
  
  const { data, mutate } = useSWR('/api/notifications', fetcher, { 
    refreshInterval: 30000,
    revalidateOnFocus: true 
  });

  const notifications = data?.notifications || [];
  const unreadCount = notifications.filter((n: any) => !n.read && n.projectId === projectId).length;

  const projectNotifications = notifications
    .filter((n: any) => n.projectId === projectId)
    .slice(0, 10);

  const handleMarkAsRead = async (id?: string) => {
    await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: id })
    });
    mutate(); // revalidate
  };

  const handleNotificationClick = async (n: any) => {
    if (!n.read) {
      await handleMarkAsRead(n.id);
    }
    // Navigate based on type
    if (n.type.startsWith('contract')) {
      router.push(`/projects/${projectId}/contract`);
    } else if (n.type.startsWith('deliverable') || n.type === 'revision_requested') {
      router.push(`/projects/${projectId}/deliverables`);
    } else if (n.type.startsWith('comment')) {
      router.push(`/projects/${projectId}/discussions`);
    } else if (n.type === 'file_uploaded') {
      router.push(`/projects/${projectId}/files`);
    } else {
      router.push(`/projects/${projectId}`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-muted/50 transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-sm ring-2 ring-background">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] sm:w-80 shadow-lg border-border/40 p-0 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-muted/20 border-b">
          <span className="font-semibold text-sm">Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead()} className="h-auto p-0 text-xs text-primary hover:text-primary/80 hover:bg-transparent">
              Mark all as read
            </Button>
          )}
        </div>
        <div className="max-h-[350px] overflow-y-auto flex flex-col">
          {projectNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                <Bell className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-foreground/80">You're all caught up</p>
              <p className="text-xs text-muted-foreground mt-1">No new notifications for this project.</p>
            </div>
          ) : (
            projectNotifications.map((n: any) => (
              <div 
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`flex gap-3 px-4 py-3 text-sm cursor-pointer hover:bg-muted/40 transition-colors border-b last:border-0 ${!n.read ? 'bg-primary/5' : ''}`}
              >
                {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                <div className={`flex flex-col gap-1 ${n.read ? 'ml-5' : ''}`}>
                  <p className="text-foreground leading-snug">{n.message}</p>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    {new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
