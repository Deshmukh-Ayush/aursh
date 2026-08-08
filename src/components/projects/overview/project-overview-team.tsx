import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { OverviewMember } from "./project-overview-types";

type ProjectOverviewTeamProps = {
  members: OverviewMember[];
};

const ROLE_CONFIG: Record<string, { label: string; bg: string }> = {
  owner: { label: "Owner", bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  agency: { label: "Agency", bg: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  client: { label: "Client", bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
};

export function ProjectOverviewTeam({ members }: ProjectOverviewTeamProps) {
  return (
    <div className="lg:col-span-2 flex flex-col h-full rounded-md border border-border/40 bg-neutral-100 p-1 shadow-xs dark:bg-neutral-900">
      <div className="rounded-md bg-white p-4 dark:bg-neutral-950 flex flex-col h-full justify-between gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-semibold tracking-tight text-foreground">
            Project Members (<span className="tabular-nums">{members.length}</span>)
          </h2>
        </div>

        <div className="space-y-1">
          {members.map((member) => {
            const roleConfig = ROLE_CONFIG[member.role] ?? { label: member.role, bg: "bg-muted text-muted-foreground" };
            return (
              <div key={member.id} className="group flex items-center justify-between gap-3 py-2 px-2.5 hover:bg-muted/40 border-b border-border/30 last:border-0 transition-colors rounded-md">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <Avatar className="h-6 w-6 shrink-0 border border-background">
                    <AvatarImage src={member.user.image || ""} className="rounded-full" />
                    <AvatarFallback className="bg-muted text-muted-foreground text-[9px] font-semibold">
                      {member.user.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-semibold text-foreground truncate">{member.user.name}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${roleConfig.bg} shrink-0`}>
                  {roleConfig.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
