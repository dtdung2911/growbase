import { format, startOfMonth, endOfMonth, subDays, addMonths } from "date-fns"

export const monthRange = (yearMonth: string) => {
  const start = startOfMonth(new Date(yearMonth + "-01"))
  return {
    from: format(start, "yyyy-MM-dd"),
    to: format(endOfMonth(start), "yyyy-MM-dd"),
    // Half-open VN-timezone bounds [fromTs, toTs) for timestamptz columns.
    // Comparing a timestamptz to a bare date drops last-day rows (date = 00:00)
    // and mis-drops first-day rows once VN offset shifts them before UTC midnight.
    fromTs: `${format(start, "yyyy-MM-dd")}T00:00:00+07:00`,
    toTs: `${format(addMonths(start, 1), "yyyy-MM-dd")}T00:00:00+07:00`,
  }
}

// A timestamptz belongs to the VN calendar day/month it falls on (business day = VN).
export const txDateVN = (ts: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(ts))

export const txMonthVN = (ts: string) => txDateVN(ts).slice(0, 7)

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
