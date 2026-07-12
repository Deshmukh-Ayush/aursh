import Link from "next/link";
import { ArrowRight, Activity, CheckCircle2, Files, MessageSquare } from "lucide-react";
import { ProjectOverviewCard } from "./project-overview-card";

type ProjectOverviewLinksProps = {
  projectId: string;
  totalDelivs: number;
  totalFiles: number;
};

export function ProjectOverviewLinks({ projectId, totalDelivs, totalFiles }: ProjectOverviewLinksProps) {
  return (
    <ProjectOverviewCard className="lg:col-span-2" padding="md">
      <h2 className="mb-3 text-[13px] font-semibold text-foreground">Quick Links</h2>
      <div className="space-y-1">
        {[
          { label: "Deliverables", href: `/projects/${projectId}/deliverables`, icon: CheckCircle2, desc: `${totalDelivs} total` },
          { label: "Files", href: `/projects/${projectId}/files`, icon: Files, desc: `${totalFiles} uploaded` },
          { label: "Discussions", href: `/projects/${projectId}/discussions`, icon: MessageSquare, desc: "Team conversations" },
          { label: "Activity Log", href: `/projects/${projectId}/activity`, icon: Activity, desc: "Full history" },
        ].map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground transition-[background-color,transform] hover:bg-muted/50 active:scale-[0.98]"
            >
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
              <div className="min-w-0 flex-1">
                <span className="text-[13px] font-medium">{link.label}</span>
              </div>
              <span className="text-[11px] tabular-nums text-muted-foreground">{link.desc}</span>
              <ArrowRight className="h-3 w-3 text-muted-foreground/0 transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
            </Link>
          );
        })}
      </div>
    </ProjectOverviewCard>
  );
}
