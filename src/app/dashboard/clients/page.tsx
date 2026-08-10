import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { ClientsHeroChart } from "@/components/dashboard/clients/clients-hero-chart"
import { ClientsTable } from "@/components/dashboard/clients/clients-table"

export default function DashboardClientsPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Clients</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage client relationships, track active proposals, and monitor contract sign-offs across your workspace.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Sleek Bar Chart: Proposals Sent vs Clients Closed */}
        <Suspense fallback={<Skeleton className="h-[340px] w-full rounded-md" />}>
          <ClientsHeroChart />
        </Suspense>

        {/* Minimal Client Management Table */}
        <Suspense fallback={<Skeleton className="h-[380px] w-full rounded-md" />}>
          <ClientsTable />
        </Suspense>
      </div>
    </div>
  )
}
