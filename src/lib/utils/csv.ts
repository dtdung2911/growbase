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
  const stripped = value.replace(/[^\d.,-]/g, "")
  if (!stripped) return 0

  const lastDot = stripped.lastIndexOf(".")
  const lastComma = stripped.lastIndexOf(",")

  let cleaned: string
  if (lastDot > lastComma) {
    // dot is decimal: "142,560.00" → remove commas, keep last dot
    cleaned = stripped.replace(/,/g, "")
  } else if (lastComma > lastDot) {
    // comma is decimal: "142.560,00" → remove dots, comma→dot
    cleaned = stripped.replace(/\./g, "").replace(",", ".")
  } else {
    // no separator or only one type
    cleaned = stripped.replace(/,/g, "")
  }

  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : Math.abs(num)
}

export function parseDate(value: string): string | null {
  const trimmed = value.trim()

  // DD/MM/YYYY or DD-MM-YYYY (with optional time portion)
  const dmy = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/)
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`

  // YYYY-MM-DD (with optional time portion)
  const ymd = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`

  // YYYY/MM/DD (with optional time portion)
  const ymd2 = trimmed.match(/^(\d{4})\/(\d{2})\/(\d{2})/)
  if (ymd2) return `${ymd2[1]}-${ymd2[2]}-${ymd2[3]}`

  return null
}
