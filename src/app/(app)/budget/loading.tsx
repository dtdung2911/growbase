import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonList } from "@/components/shared/SkeletonList"

export default function Loading() {
  return (
    <div className="space-y-4 p-4 pb-16">
      {/* Month selector */}
      <Skeleton className="mx-auto h-8 w-40" />
      {/* Summary bar */}
      <Skeleton className="h-12 w-full rounded-2xl" />
      <SkeletonList count={6} />
    </div>
  )
}
