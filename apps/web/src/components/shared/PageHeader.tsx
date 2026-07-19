"use client"

import Link from "next/link"
import { Icon } from "@iconify/react"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { cn } from "@/lib/utils/cn"

export type BreadcrumbItem = {
  labelKey: string
  href?: string
}

type PageHeaderProps = {
  // Accept pre-translated string (preferred) OR i18n key (legacy)
  title?: string
  titleKey?: string
  breadcrumbs?: BreadcrumbItem[]
  breadcrumb?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  titleKey,
  breadcrumbs,
  breadcrumb,
  actions,
  className,
}: PageHeaderProps) {
  const { t } = useTranslation()

  const resolvedTitle = title
    ?? (titleKey
      ? (titleKey.startsWith("!") ? titleKey.slice(1) : t(titleKey))
      : "")

  return (
    <div
      className={cn(
        "mb-6 flex items-center justify-between rounded-[13px] px-6 py-5",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
            {breadcrumbs.map((crumb, i) => {
              const label = crumb.labelKey.startsWith("!")
                ? crumb.labelKey.slice(1)
                : t(crumb.labelKey);
              return (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && (
                    <Icon icon="lucide:chevron-right" className="h-3 w-3" />
                  )}
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="transition-colors hover:text-foreground"
                    >
                      {label}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground">{label}</span>
                  )}
                </span>
              );
            })}
          </nav>
        )}
        {breadcrumb}
      </div>
      {actions && (
        <div className="ml-4 flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
