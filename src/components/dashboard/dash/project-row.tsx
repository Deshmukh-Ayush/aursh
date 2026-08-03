import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { ProjectRowMenu } from "@/components/dashboard/project-row-menu";

import { getRelativeTime } from "@/utils/dash-utils";
import type { DashboardAgencyProject } from "@/types/dash-types";

interface ProjectRowProps {
  data: DashboardAgencyProject;
}

export function ProjectRow({ data }: ProjectRowProps) {
  const proj = data.proj;
  const latestContract = data.contracts[0];
  const latestInvite = data.invitations[0];

  const totalDeliv = data.deliverables.length;
  const approvedDeliv = data.deliverables.filter((d) => d.status === "approved").length;
  const progress = totalDeliv === 0 ? 0 : Math.round((approvedDeliv / totalDeliv) * 100);

  const lastLog = data.activityLogs[0];
  const lastActiveText = lastLog ? getRelativeTime(new Date(lastLog.createdAt)) : "No activity";
  const draftContractId = latestContract?.status === "draft" ? latestContract.id : undefined;

  const hasAcceptedClient = data.invitations.some((i) => i.status === "accepted");
  const isContractSigned = latestContract?.status === "signed";

  let statusBadge = (
    <Badge variant="secondary" className="capitalize">
      {proj.status}
    </Badge>
  );

  if (proj.status === "active") {
    if (!hasAcceptedClient && latestInvite?.status === "pending") {
      statusBadge = (
        <Badge variant="outline" className="border-amber-600/30 text-amber-600">
          Invited
        </Badge>
      );
    } else if (hasAcceptedClient && !isContractSigned && latestContract?.status === "pending_signature") {
      statusBadge = (
        <Badge variant="outline" className="border-blue-600/30 text-blue-600">
          Waiting on Contract
        </Badge>
      );
    } else {
      statusBadge = (
        <div className="flex w-fit items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
          <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          Active
        </div>
      );
    }
  }

  return (
    <TableRow className="group cursor-pointer transition-colors hover:bg-muted/30">
      <TableCell className="font-medium">
        <Link
          href={`/projects/${proj.id}`}
          className="flex items-center gap-2 underline-offset-4 hover:underline decoration-primary/30"
        >
          {proj.name}
        </Link>
      </TableCell>

      <TableCell>{statusBadge}</TableCell>

      <TableCell>
        <div className="flex w-35 flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
            <span>
              {approvedDeliv} / {totalDeliv}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Progress value={progress} className={`h-1.5 ${totalDeliv === 0 ? "opacity-30" : ""}`} />
            <span className="tabular-nums text-xs text-muted-foreground">{progress}%</span>
          </div>
        </div>
      </TableCell>

      <TableCell className="text-sm text-muted-foreground">
        {lastActiveText}
      </TableCell>

      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Link href={`/projects/${proj.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>

          <ProjectRowMenu
            projectId={proj.id}
            projectName={proj.name}
            draftContractId={draftContractId}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}