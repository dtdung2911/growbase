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
  autoFocus?: boolean
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
  autoFocus,
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
      autoFocus={autoFocus}
      value={display}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "")
        onChange(digits ? Number(digits) : 0)
      }}
      className={cn(
        "flex h-[44px] w-full rounded-[18px] border border-border bg-background px-4 py-2.5 text-base font-mono tabular-nums ring-offset-background transition-[border-color,box-shadow] duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none placeholder:text-faint focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    />
  )
}
