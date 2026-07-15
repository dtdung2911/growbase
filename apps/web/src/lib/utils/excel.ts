import * as XLSX from "xlsx"

export type ExcelRow = Record<string, string>

export function parseExcel(buffer: ArrayBuffer): {
  headers: string[]
  rows: ExcelRow[]
} {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return { headers: [], rows: [] }

  const sheet = workbook.Sheets[sheetName]
  if (!sheet || !sheet["!ref"]) return { headers: [], rows: [] }

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: false,
    defval: "",
    raw: false,
  })

  if (matrix.length < 2) return { headers: [], rows: [] }

  const headers = matrix[0].map((cell: unknown, i: number) => {
    const value = cellToString(cell)
    return value || `Column ${i + 1}`
  })

  const rows: ExcelRow[] = []
  for (let i = 1; i < matrix.length; i++) {
    const values = matrix[i]
    const row: ExcelRow = {}
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = cellToString(values[j])
    }
    rows.push(row)
  }

  return { headers, rows }
}

function cellToString(cell: unknown): string {
  if (cell === null || cell === undefined) return ""
  if (cell instanceof Date) return formatDateCell(cell)
  if (typeof cell === "number") return String(cell)
  if (typeof cell === "boolean") return cell ? "TRUE" : "FALSE"
  return String(cell).trim()
}

function formatDateCell(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}
