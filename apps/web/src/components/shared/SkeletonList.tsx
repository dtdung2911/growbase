import { Skeleton } from "@/components/ui/skeleton"

type SkeletonListProps = {
  count?: number
}

export function SkeletonList({ count = 5 }: SkeletonListProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-[13px] border border-border/40 bg-card p-3 shadow-card"
        >
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  )
}
