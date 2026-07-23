export type CsvRow = Record<string, string>

export function parseCsv(text: string): { headers: string[]; rows: CsvRow[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return { headers: [], rows: [] }

  const headers = parseCsvLine(lines[0])
  const rows: CsvRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i])
    if (values.length === 0) continue
    const row: CsvRow = {}
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] ?? ""
    }
    rows.push(row)
  }

  return { headers, rows }
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        current += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ",") {
      result.push(current.trim())
      current = ""
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

export type ColumnMapping = {
  date: string | null
  amount: string | null
  debit: string | null
  credit: string | null
  description: string | null
  balance: string | null
}

const DATE_PATTERNS = [
  "date", "ngày", "ngay", "ngày giao dịch", "ngay giao dich",
  "transaction date", "thời gian", "thoi gian",
]
const AMOUNT_PATTERNS = [
  "amount", "số tiền", "so tien", "giá trị", "gia tri",
]
const DEBIT_PATTERNS = [
  "debit", "ghi nợ", "ghi no", "chi", "phát sinh nợ", "phat sinh no", "rút", "rut",
]
const CREDIT_PATTERNS = [
  "credit", "ghi có", "ghi co", "thu", "phát sinh có", "phat sinh co", "nạp", "nap",
]
const DESC_PATTERNS = [
  "description", "mô tả", "mo ta", "diễn giải", "dien giai",
  "nội dung", "noi dung", "ghi chú", "ghi chu", "chi tiết", "chi tiet",
]
const BALANCE_PATTERNS = [
  "balance", "số dư", "so du", "remaining", "còn lại",
]

function matchColumn(header: string, patterns: string[]): boolean {
  const h = header.toLowerCase().trim()
  return patterns.some((p) => h === p || h.includes(p))
}

export function autoDetectMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    date: null,
    amount: null,
    debit: null,
    credit: null,
    description: null,
    balance: null,
  }

  for (const h of headers) {
    if (!mapping.date && matchColumn(h, DATE_PATTERNS)) mapping.date = h
    else if (!mapping.debit && matchColumn(h, DEBIT_PATTERNS)) mapping.debit = h
    else if (!mapping.credit && matchColumn(h, CREDIT_PATTERNS)) mapping.credit = h
    else if (!mapping.amount && matchColumn(h, AMOUNT_PATTERNS)) mapping.amount = h
    else if (!mapping.description && matchColumn(h, DESC_PATTERNS)) mapping.description = h
    else if (!mapping.balance && matchColumn(h, BALANCE_PATTERNS)) mapping.balance = h
  }

  return mapping
}

export function parseAmount(value: string): number {
  const stripped = value.replace(/[^\d.,-]/g, "").replace(/-/g, "")
  if (!stripped) return 0

  const lastDot = stripped.lastIndexOf(".")
  const lastComma = stripped.lastIndexOf(",")
  const lastSep = Math.max(lastDot, lastComma)

  let cleaned: string
  if (lastSep === -1) {
    cleaned = stripped
  } else {
    const sep = lastDot > lastComma ? "." : ","
    const decimals = stripped.length - lastSep - 1
    const sepCount = stripped.split(sep).length - 1
    // Dấu cuối là thập phân chỉ khi loại đó xuất hiện đúng 1 lần và theo sau 1-2 chữ số;
    // "1.000.000"/"1,000,000" (nhiều dấu) = phân tách nghìn → không thập phân.
    if (sepCount === 1 && decimals >= 1 && decimals <= 2) {
      cleaned = `${stripped.slice(0, lastSep).replace(/[.,]/g, "")}.${stripped.slice(lastSep + 1)}`
    } else {
      cleaned = stripped.replace(/[.,]/g, "")
    }
  }

  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : Math.abs(num)
}

// Trả date-only "YYYY-MM-DD" khi ô chỉ có ngày; nếu có giờ (H:i hoặc H:i:s) thì
// trả ISO đủ giờ với offset VN "+07:00" để giữ đúng giờ tường (wall-clock) người nhập.
export function parseDate(value: string): string | null {
  const trimmed = value.trim()
  const time = trimmed.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*$/)

  const build = (y: string, mo: string, d: string) => {
    const date = `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`
    if (!time) return date
    return `${date}T${time[1].padStart(2, "0")}:${time[2]}:${time[3] ?? "00"}+07:00`
  }

  const dmy = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/)
  if (dmy) return build(dmy[3], dmy[2], dmy[1])

  const ymd = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (ymd) return build(ymd[1], ymd[2], ymd[3])

  const ymd2 = trimmed.match(/^(\d{4})\/(\d{2})\/(\d{2})/)
  if (ymd2) return build(ymd2[1], ymd2[2], ymd2[3])

  return null
}
