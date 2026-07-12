import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ProjectMemberSummary } from "./project-overview-types";

type ProjectOverviewAvatarStackProps = {
  members: ProjectMemberSummary[];
  limit?: number;
};

export function ProjectOverviewAvatarStack({ members, limit = 4 }: ProjectOverviewAvatarStackProps) {
  return (
    <div className="flex -space-x-2">
      {members.slice(0, limit).map((member) => (
        <Avatar
          key={member.id}
          className="h-8 w-8 ring-2 ring-background shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
          title={member.user.name || "Team Member"}
        >
          <AvatarImage
            src={member.user.image || ""}
            className="rounded-full outline outline-black/8 dark:outline-white/8"
          />
          <AvatarFallback className="bg-muted text-muted-foreground text-[11px] font-semibold">
            {member.user.name?.charAt(0).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
      ))}
      {members.length > limit && (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted ring-2 ring-background text-[11px] font-semibold text-muted-foreground">
          +{members.length - limit}
        </div>
      )}
    </div>
  );
}
