import { SkeletonCard } from "@/components/shared/SkeletonCard"

export default function Loading() {
  return (
    <div className="space-y-3 p-4 pb-16">
      {Array.from({ length: 4 }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
