import { cn } from "@/lib/utils/cn"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg animate-shimmer motion-reduce:animate-none",
        "bg-[linear-gradient(90deg,hsl(var(--muted)/0.2)_25%,hsl(var(--muted)/0.5)_50%,hsl(var(--muted)/0.2)_75%)] bg-[length:200%_100%]",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
