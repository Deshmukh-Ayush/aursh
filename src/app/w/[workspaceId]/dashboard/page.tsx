import { Dash } from "@/components/dashboard/dash";

export default async function DashboardPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  return (
    <Dash workspaceId={workspaceId} />
  )
}