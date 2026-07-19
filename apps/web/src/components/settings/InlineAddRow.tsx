"use client"

import { useState } from "react"
import { Icon } from "@iconify/react"
import { cn } from "@/lib/utils/cn"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type InlineAddRowProps = {
  placeholder: string
  isPending?: boolean
  onSave: (value: string) => void
  onCancel: () => void
  className?: string
}

export function InlineAddRow({
  placeholder,
  isPending,
  onSave,
  onCancel,
  className,
}: InlineAddRowProps) {
  const [value, setValue] = useState("")

  const handleSave = () => {
    const trimmed = value.trim()
    if (!trimmed) return
    onSave(trimmed)
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave()
          if (e.key === "Escape") onCancel()
        }}
        placeholder={placeholder}
        className="h-9 rounded-lg bg-inset text-base"
        autoFocus
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 text-success hover:text-success"
        disabled={!value.trim() || isPending}
        onClick={handleSave}
      >
        {isPending ? (
          <Icon icon="lucide:loader-2" className="h-4 w-4 animate-spin" />
        ) : (
          <Icon icon="lucide:check" className="h-4 w-4" />
        )}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0"
        disabled={isPending}
        onClick={onCancel}
      >
        <Icon icon="lucide:x" className="h-4 w-4" />
      </Button>
    </div>
  )
}
