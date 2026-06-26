import { cn } from "@/lib/utils/cn"

type BrandLogoVariant = "horizontal" | "vertical" | "mark" | "app"
type BrandLogoTone = "light" | "dark"

interface BrandLogoProps {
  variant?: BrandLogoVariant
  tone?: BrandLogoTone
  className?: string
  imageClassName?: string
  decorative?: boolean
}

const LOGO_SRC: Record<BrandLogoVariant, Record<BrandLogoTone, string>> = {
  horizontal: {
    light: "/brand/logo-horizontal-light.svg",
    dark: "/brand/logo-horizontal-dark.svg",
  },
  vertical: {
    light: "/brand/logo-vertical-dark.svg",
    dark: "/brand/logo-vertical-dark.svg",
  },
  mark: {
    light: "/brand/icon-mark.svg",
    dark: "/brand/icon-mark.svg",
  },
  app: {
    light: "/brand/icon-app-light.svg",
    dark: "/brand/icon-app-dark.svg",
  },
}

const LOGO_SIZE: Record<BrandLogoVariant, string> = {
  horizontal: "h-16 w-auto",
  vertical: "h-28 w-auto",
  mark: "h-12 w-12",
  app: "h-12 w-12",
}

export function BrandLogo({
  variant = "horizontal",
  tone = "light",
  className,
  imageClassName,
  decorative = false,
}: BrandLogoProps) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <img
        src={LOGO_SRC[variant][tone]}
        alt={decorative ? "" : "GrowBase"}
        aria-hidden={decorative}
        className={cn(LOGO_SIZE[variant], imageClassName)}
      />
    </span>
  )
}
