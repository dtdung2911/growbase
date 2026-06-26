"use client"

import { useState } from "react"
import { Icon } from "@iconify/react"
import { Button } from "@/components/ui/button"
import { QuickAddSheet } from "@/components/transactions/QuickAddSheet"

export function QuickAddFAB() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        size="icon"
        aria-label="Add transaction"
        className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-float"
        onClick={() => setOpen(true)}
      >
        <Icon icon="lucide:plus" className="h-6 w-6" />
      </Button>
      <QuickAddSheet open={open} onOpenChange={setOpen} />
    </>
  )
}
