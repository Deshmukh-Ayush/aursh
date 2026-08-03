import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { OverviewMember } from "./project-overview-types";
import { ProjectOverviewCard } from "./project-overview-card";

type ProjectOverviewTeamProps = {
  members: OverviewMember[];
};

const ROLE_CONFIG: Record<string, { label: string; className: string }> = {
  owner: { label: "Owner", className: "text-violet-600 dark:text-violet-400" },
  agency: { label: "Agency", className: "text-blue-600 dark:text-blue-400" },
  client: { label: "Client", className: "text-amber-600 dark:text-amber-400" },
};

export function ProjectOverviewTeam({ members }: ProjectOverviewTeamProps) {
  return (
    <ProjectOverviewCard className="lg:col-span-2" padding="md">
      <h2 className="mb-3 text-[13px] font-semibold text-foreground">
        Team
        <span className="ml-1.5 tabular-nums text-muted-foreground font-normal">({members.length})</span>
      </h2>

      <div className="space-y-0">
        {members.map((member) => {
          const roleConfig = ROLE_CONFIG[member.role] ?? { label: member.role, className: "text-muted-foreground" };
          return (
            <div key={member.id} className="flex items-center gap-3 rounded-lg py-2 transition-colors hover:bg-muted/50">
              <Avatar className="h-7 w-7 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-black/10 dark:ring-white/10">
                <AvatarImage
                  src={member.user.image || ""}
                  className="rounded-full"
                />
                <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-semibold">
                  {member.user.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-foreground truncate">{member.user.name}</p>
              </div>
              <span className={`shrink-0 text-[11px] font-medium ${roleConfig.className}`}>
                {roleConfig.label}
              </span>
            </div>
          );
        })}
      </div>
    </ProjectOverviewCard>
  );
}
