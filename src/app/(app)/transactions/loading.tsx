import { SkeletonList } from "@/components/shared/SkeletonList"

export default function Loading() {
  return (
    <div className="space-y-4 p-4 pb-16">
      <SkeletonList count={8} />
    </div>
  )
}
