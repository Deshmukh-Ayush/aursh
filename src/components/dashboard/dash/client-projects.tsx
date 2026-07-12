import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { ActivityChart } from "../activity-chart";
import type {
  DashboardActivityPoint,
  DashboardClientProject,
} from "@/types/dash-types";

interface ClientProjectsProps {
  projects: DashboardClientProject[];
  activityData: DashboardActivityPoint[];
}

export function ClientProjects({
  projects,
  activityData,
}: ClientProjectsProps) {
  if (projects.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="border-b pb-2 text-xl font-semibold">
        Projects You&apos;re Invited To
      </h2>

      <ActivityChart data={activityData} />

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        {projects.map(({ proj }) => (
          <Link
            key={proj.id}
            href={`/projects/${proj.id}/contract`}
            className="block h-full transition-transform hover:-translate-y-1"
          >
            <Card className="flex h-full cursor-pointer flex-col border-primary/20 shadow-sm hover:shadow-md">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl">
                    {proj.name}
                  </CardTitle>

                  <Badge
                    variant="outline"
                    className="bg-primary/5"
                  >
                    Client
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="mt-auto border-t pt-4">
                <span className="text-sm font-medium text-primary">
                  Open Workspace →
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}