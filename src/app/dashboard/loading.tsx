import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      {/* Page Title skeleton */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          High-level metrics and workspace performance.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <Skeleton className="h-[180px] w-full rounded-md" />
        <Skeleton className="h-[320px] w-full rounded-md" />
      </div>
    </div>
  )
}
