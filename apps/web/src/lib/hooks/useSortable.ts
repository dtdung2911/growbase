"use client"

import { useMemo, useState } from "react"

export type SortDirection = "asc" | "desc"

export type SortConfig<T> = {
  column: keyof T
  direction: SortDirection
}

type UseSortableResult<T> = {
  sortedData: T[]
  sortColumn: keyof T | null
  sortDirection: SortDirection
  onSort: (column: keyof T) => void
}

function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0
  if (a == null) return -1
  if (b == null) return 1

  if (typeof a === "number" && typeof b === "number") return a - b

  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime()

  const aStr = String(a)
  const bStr = String(b)

  const aNum = Number(aStr)
  const bNum = Number(bStr)
  if (!Number.isNaN(aNum) && !Number.isNaN(bNum) && aStr.trim() !== "" && bStr.trim() !== "") {
    return aNum - bNum
  }

  return aStr.localeCompare(bStr)
}

export function useSortable<T>(
  data: T[],
  defaultSort?: SortConfig<T>
): UseSortableResult<T> {
  const [sortColumn, setSortColumn] = useState<keyof T | null>(
    defaultSort?.column ?? null
  )
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    defaultSort?.direction ?? "asc"
  )

  // none → asc → desc → none
  const onSort = (column: keyof T) => {
    if (sortColumn !== column) {
      setSortColumn(column)
      setSortDirection("asc")
      return
    }
    if (sortDirection === "asc") {
      setSortDirection("desc")
      return
    }
    setSortColumn(null)
    setSortDirection("asc")
  }

  const sortedData = useMemo(() => {
    if (!sortColumn) return data

    const factor = sortDirection === "asc" ? 1 : -1
    // index keeps the sort stable for equal values
    return data
      .map((item, index) => ({ item, index }))
      .sort((a, b) => {
        const cmp = compareValues(a.item[sortColumn], b.item[sortColumn])
        if (cmp !== 0) return cmp * factor
        return a.index - b.index
      })
      .map(({ item }) => item)
  }, [data, sortColumn, sortDirection])

  return { sortedData, sortColumn, sortDirection, onSort }
}
