import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonList } from "@/components/shared/SkeletonList"

export default function Loading() {
  return (
    <div className="space-y-4 p-4 pb-16">
      {/* Total net worth */}
      <div className="space-y-2 rounded-[13px] border border-border/40 bg-card p-4 shadow-card">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-40" />
      </div>
      {/* Account groups */}
      <SkeletonList count={5} />
    </div>
  )
}
