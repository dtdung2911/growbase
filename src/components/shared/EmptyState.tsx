import { Icon } from "@iconify/react"
import { Button } from "@/components/ui/button"

type EmptyStateProps = {
  icon: string
  title: string
  description: string
  ctaLabel?: string
  onCta?: () => void
}

export function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  onCta,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-[13px] border border-border/40 bg-card px-6 py-12 text-center shadow-card">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft">
        <Icon icon={icon} className="h-8 w-8 text-primary" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {ctaLabel && onCta && (
        <Button onClick={onCta} className="min-h-11">
          {ctaLabel}
        </Button>
      )}
    </div>
  )
}
