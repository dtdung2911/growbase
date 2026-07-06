import { format, startOfMonth, endOfMonth, subDays, addMonths } from "date-fns"

export const monthRange = (yearMonth: string) => {
  const date = new Date(yearMonth + "-01")
  return {
    from: format(startOfMonth(date), "yyyy-MM-dd"),
    to: format(endOfMonth(date), "yyyy-MM-dd"),
  }
}

export const toYearMonth = (date = new Date()) => format(date, "yyyy-MM")

export const yesterday = (date = new Date()) => format(subDays(date, 1), "yyyy-MM-dd")

// Server có thể chạy UTC — mốc "hôm nay/hôm qua" nghiệp vụ phải theo giờ Việt Nam,
// không theo TZ của runtime. en-CA cho sẵn định dạng yyyy-mm-dd.
export const todayVN = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date())

export const yesterdayVN = () => {
  const d = new Date(todayVN() + "T00:00:00Z")
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

export const addMonthsIso = (months: number, from = new Date()) =>
  format(addMonths(from, months), "yyyy-MM-dd")

export const firstDayOfMonth = (yearMonth: string) => yearMonth + "-01"
