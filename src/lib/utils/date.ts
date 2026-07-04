import { format, startOfMonth, endOfMonth, subDays } from "date-fns"

export const monthRange = (yearMonth: string) => {
  const date = new Date(yearMonth + "-01")
  return {
    from: format(startOfMonth(date), "yyyy-MM-dd"),
    to: format(endOfMonth(date), "yyyy-MM-dd"),
  }
}

export const toYearMonth = (date = new Date()) => format(date, "yyyy-MM")

export const yesterday = (date = new Date()) => format(subDays(date, 1), "yyyy-MM-dd")

export const firstDayOfMonth = (yearMonth: string) => yearMonth + "-01"
