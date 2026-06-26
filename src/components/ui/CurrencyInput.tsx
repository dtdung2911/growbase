"use client"

import * as React from "react"
import { cn } from "@/lib/utils/cn"
import { formatVND } from "@/lib/utils/currency"

interface CurrencyInputProps {
  value: number
  onChange: (value: number) => void
  currency?: "VND" | "USD"
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
}

function formatDisplay(value: number, currency: "VND" | "USD") {
  if (!value) return ""
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value)
  }
  return formatVND(value)
}

export function CurrencyInput({
  value,
  onChange,
  currency = "VND",
  placeholder,
  disabled,
  className,
  id,
}: CurrencyInputProps) {
  const [focused, setFocused] = React.useState(false)

  const display = focused
    ? value
      ? String(value)
      : ""
    : formatDisplay(value, currency)

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      disabled={disabled}
      placeholder={placeholder}
      value={display}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "")
        onChange(digits ? Number(digits) : 0)
      }}
      className={cn(
        "flex min-h-[48px] w-full rounded-lg border border-input bg-background px-4 py-2.5 text-[15px] ring-offset-background transition-all duration-200 placeholder:text-faint focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    />
  )
}
