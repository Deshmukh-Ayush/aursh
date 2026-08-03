import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DashboardAgencyProject } from "@/types/dash-types";
import { ProjectRow } from "./project-row";

interface ProjectTableProps {
  projects: DashboardAgencyProject[];
}

export function ProjectTable({ projects }: ProjectTableProps) {
  if (projects.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-md border bg-card shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-75">Project Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Deliverables</TableHead>
            <TableHead>Last Active</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {projects.map((data) => (
            <ProjectRow key={data.proj.id} data={data} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}