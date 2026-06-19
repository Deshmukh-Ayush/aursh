import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectLoading() {
  return (
    <div className="space-y-6 max-w-5xl animate-pulse">
      <div className="space-y-2">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-[250px] w-full rounded-xl" />
        <Skeleton className="h-[250px] w-full rounded-xl" />
      </div>

      <div className="space-y-4 mt-8">
        <Skeleton className="h-[100px] w-full rounded-xl" />
        <Skeleton className="h-[100px] w-full rounded-xl" />
        <Skeleton className="h-[100px] w-full rounded-xl" />
      </div>
    </div>
  );
}
