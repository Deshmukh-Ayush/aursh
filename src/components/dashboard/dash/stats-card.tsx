import {
  CheckCircle2,
  FileSignature,
  LayoutDashboard,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { CompletionChart } from "../completion-chart";
import type {
  DashboardAgencyProject,
  DashboardStats,
} from "@/types/dash-types";

interface StatsCardsProps {
  stats: DashboardStats;
  projects: DashboardAgencyProject[];
}

export function StatsCards({
  stats,
  projects,
}: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

      <Card className="border-border/40 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Active Projects
          </CardTitle>

          <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>

        <CardContent>
          <div className="text-3xl font-bold tabular-nums">
            {stats.totalActiveProjects}
          </div>

          {stats.newProjectsThisWeek > 0 && (
            <p className="mt-1 text-xs font-medium text-green-600 dark:text-green-400">
              +{stats.newProjectsThisWeek} this week
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/40 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Pending Signatures
          </CardTitle>

          <FileSignature className="h-4 w-4 text-muted-foreground" />
        </CardHeader>

        <CardContent>
          <div className="text-3xl font-bold tabular-nums">
            {stats.pendingSignatures}
          </div>
        </CardContent>
      </Card>

      <CompletionChart projects={projects} />

      <Card className="border-border/40 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Completed Projects
          </CardTitle>

          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>

        <CardContent>
          <div className="text-3xl font-bold tabular-nums">
            {stats.completedProjects}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}