import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonList } from "@/components/shared/SkeletonList"

export default function Loading() {
  return (
    <div className="space-y-4 p-4 pb-16">
      {/* Tabs skeleton */}
      <div className="flex gap-1 rounded-xl bg-muted p-1">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-8 flex-1 rounded-lg" />
        ))}
      </div>
      <SkeletonList count={5} />
    </div>
  )
}
