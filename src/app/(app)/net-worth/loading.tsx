import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonList } from "@/components/shared/SkeletonList"

export default function Loading() {
  return (
    <div className="space-y-4 p-4 pb-16">
      {/* Total net worth */}
      <div className="space-y-2 rounded-[15px] border border-border bg-card p-4 shadow-panel">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-40" />
      </div>
      {/* Account groups */}
      <SkeletonList count={5} />
    </div>
  )
}
