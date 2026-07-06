"use client"

import { useMemo, useRef, useState } from "react"
import { Icon } from "@iconify/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils/cn"
import { formatVND } from "@/lib/utils/currency"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { useAppStore } from "@/lib/stores/appStore"
import { useAccounts } from "@/lib/hooks/useAccounts"
import { useCategories, type CategoryGroupWithCategories } from "@/lib/hooks/useCategories"
import {
  useImportTransactions,
  type ImportRow,
} from "@/lib/hooks/useImportTransactions"
import {
  parseCsv,
  autoDetectMapping,
  parseAmount,
  parseDate,
  type CsvRow,
  type ColumnMapping,
} from "@/lib/utils/csv"
import { parseExcel } from "@/lib/utils/excel"
import { matchCategory } from "@/lib/utils/category-matcher"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/PageHeader"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CategoryPicker } from "@/components/transactions/CategoryPicker"

type Step = 1 | 2 | 3 | 4
type AmountMode = "single" | "dual"
type FileType = "csv" | "excel"

type PreviewRow = {
  index: number
  date: string | null
  description: string
  amount: number
  direction: "in" | "out"
  categoryId: string | null
  autoMatched: boolean
  confidence: number
  selected: boolean
  valid: boolean
}

const NONE = "__none__"

const EXCEL_EXTENSIONS = [".xlsx", ".xls"]

function detectFileType(name: string): FileType | null {
  const lower = name.toLowerCase()
  if (lower.endsWith(".csv")) return "csv"
  if (EXCEL_EXTENSIONS.some((ext) => lower.endsWith(ext))) return "excel"
  return null
}

export function ImportClient() {
  const { t } = useTranslation()
  const router = useRouter()
  const householdId = useAppStore((s) => s.householdId)
  const { data: accounts = [] } = useAccounts()
  const { data: categories = [] } = useCategories(householdId ?? "")
  const importMutation = useImportTransactions()

  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>(1)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileType, setFileType] = useState<FileType | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<CsvRow[]>([])
  const [mapping, setMapping] = useState<ColumnMapping>({
    date: null,
    amount: null,
    debit: null,
    credit: null,
    description: null,
    balance: null,
  })
  const [amountMode, setAmountMode] = useState<AmountMode>("dual")
  const [accountId, setAccountId] = useState<string | null>(null)
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([])

  function applyParsed(file: File, type: FileType, h: string[], r: CsvRow[]) {
    setHeaders(h)
    setRows(r)
    setFileName(file.name)
    setFileType(type)
    const detected = autoDetectMapping(h)
    setMapping(detected)
    setAmountMode(detected.amount && !detected.debit ? "single" : "dual")
  }

  function handleFile(file: File) {
    const type = detectFileType(file.name)
    if (!type) {
      toast.error(t("import.unsupportedFile"), { duration: 5000 })
      return
    }

    const reader = new FileReader()

    if (type === "excel") {
      reader.onload = () => {
        try {
          const buffer = reader.result as ArrayBuffer
          const { headers: h, rows: r } = parseExcel(buffer)
          if (h.length === 0) {
            toast.error(t("import.emptyFile"), { duration: 5000 })
            return
          }
          applyParsed(file, type, h, r)
        } catch {
          toast.error(t("import.parseError"), { duration: 5000 })
        }
      }
      reader.readAsArrayBuffer(file)
      return
    }

    reader.onload = () => {
      const text = String(reader.result ?? "")
      const { headers: h, rows: r } = parseCsv(text)
      if (h.length === 0) {
        toast.error(t("import.emptyFile"), { duration: 5000 })
        return
      }
      applyParsed(file, type, h, r)
    }
    reader.readAsText(file)
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && detectFileType(file.name)) handleFile(file)
  }

  const canMap = useMemo(() => {
    if (!mapping.date) return false
    if (amountMode === "single") return Boolean(mapping.amount)
    return Boolean(mapping.debit || mapping.credit)
  }, [mapping, amountMode])

  function buildPreview() {
    const built: PreviewRow[] = rows.map((row, index) => {
      const date = mapping.date ? parseDate(row[mapping.date] ?? "") : null
      const description = mapping.description
        ? (row[mapping.description] ?? "").trim()
        : ""

      let amount = 0
      let direction: "in" | "out" = "out"

      if (amountMode === "single" && mapping.amount) {
        const raw = row[mapping.amount] ?? ""
        amount = parseAmount(raw)
        direction = raw.trim().startsWith("-") ? "out" : "in"
      } else {
        const debit = mapping.debit ? parseAmount(row[mapping.debit] ?? "") : 0
        const credit = mapping.credit ? parseAmount(row[mapping.credit] ?? "") : 0
        if (credit > 0) {
          amount = credit
          direction = "in"
        } else {
          amount = debit
          direction = "out"
        }
      }

      const match = description ? matchCategory(description, categories) : null
      const valid = Boolean(date) && amount > 0

      return {
        index,
        date,
        description,
        amount,
        direction,
        categoryId: match?.categoryId ?? null,
        autoMatched: Boolean(match),
        confidence: match?.confidence ?? 0,
        selected: valid,
        valid,
      }
    })
    setPreviewRows(built)
  }

  function goToPreview() {
    buildPreview()
    if (!accountId && accounts.length > 0) setAccountId(accounts[0].id)
    setStep(3)
  }

  const selectableRows = previewRows.filter((r) => r.valid)
  const selectedRows = previewRows.filter((r) => r.selected && r.valid)
  const missingCategoryCount = selectedRows.filter((r) => !r.categoryId).length
  const allSelected =
    selectableRows.length > 0 && selectedRows.length === selectableRows.length

  function toggleAll() {
    const next = !allSelected
    setPreviewRows((prev) =>
      prev.map((r) => (r.valid ? { ...r, selected: next } : r))
    )
  }

  function toggleRow(index: number) {
    setPreviewRows((prev) =>
      prev.map((r) =>
        r.index === index && r.valid ? { ...r, selected: !r.selected } : r
      )
    )
  }

  function setRowCategory(index: number, categoryId: string) {
    setPreviewRows((prev) =>
      prev.map((r) =>
        r.index === index ? { ...r, categoryId, autoMatched: false } : r
      )
    )
  }

  async function handleImport() {
    if (!accountId) return
    const payload: ImportRow[] = selectedRows.map((r) => ({
      transaction_date: r.date as string,
      amount: r.amount,
      direction: r.direction,
      description: r.description || undefined,
      category_id: r.categoryId ?? undefined,
      account_id: accountId,
      transaction_type: r.direction === "in" ? "income" : "expense",
    }))

    try {
      const result = await importMutation.mutateAsync(payload)
      toast.success(
        t("import.success", {
          inserted: result.inserted,
          duplicates: result.duplicates,
        }),
        { duration: 4000 }
      )
      router.push("/transactions")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import thất bại", {
        duration: 5000,
      })
    }
  }

  return (
    <div className="p-4 pb-24">
      <PageHeader
        titleKey="import.title"
        breadcrumbs={[{ labelKey: "nav.transactions", href: "/transactions" }]}
      />

      <StepsIndicator current={step} />

      <div className="mt-6 rounded-[13px] border border-border/40 bg-card p-6 shadow-card">
        {step === 1 && (
          <UploadStep
            fileName={fileName}
            fileType={fileType}
            rowCount={rows.length}
            fileInputRef={fileInputRef}
            onFileChange={onFileChange}
            onDrop={onDrop}
            onChoose={() => fileInputRef.current?.click()}
          />
        )}

        {step === 2 && (
          <MappingStep
            headers={headers}
            mapping={mapping}
            setMapping={setMapping}
            amountMode={amountMode}
            setAmountMode={setAmountMode}
          />
        )}

        {step === 3 && (
          <PreviewStep
            previewRows={previewRows}
            accounts={accounts}
            accountId={accountId}
            setAccountId={setAccountId}
            householdId={householdId ?? ""}
            categoryGroups={categories}
            allSelected={allSelected}
            selectedCount={selectedRows.length}
            totalCount={selectableRows.length}
            onToggleAll={toggleAll}
            onToggleRow={toggleRow}
            onSetCategory={setRowCategory}
          />
        )}

        {step === 4 && (
          <ConfirmStep count={selectedRows.length} total={selectedRows.reduce((s, r) => s + r.amount, 0)} />
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        {step > 1 ? (
          <Button
            variant="outline"
            className="min-h-[44px]"
            onClick={() => setStep((s) => (s - 1) as Step)}
            disabled={importMutation.isPending}
          >
            <Icon icon="lucide:chevron-left" className="mr-1 h-4 w-4" />
            {t("import.back")}
          </Button>
        ) : (
          <span />
        )}

        {step === 1 && (
          <Button
            className="min-h-[44px]"
            disabled={rows.length === 0}
            onClick={() => setStep(2)}
          >
            {t("import.next")}
            <Icon icon="lucide:chevron-right" className="ml-1 h-4 w-4" />
          </Button>
        )}

        {step === 2 && (
          <Button className="min-h-[44px]" disabled={!canMap} onClick={goToPreview}>
            {t("import.next")}
            <Icon icon="lucide:chevron-right" className="ml-1 h-4 w-4" />
          </Button>
        )}

        {step === 3 && (
          <div className="flex items-center gap-3">
            {missingCategoryCount > 0 && (
              <span className="text-xs text-warning">
                {t("import.missingCategory", { count: missingCategoryCount })}
              </span>
            )}
            <Button
              className="min-h-[44px]"
              disabled={selectedRows.length === 0 || !accountId || missingCategoryCount > 0}
              onClick={() => setStep(4)}
            >
              {t("import.next")}
              <Icon icon="lucide:chevron-right" className="ml-1 h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 4 && (
          <Button
            className="min-h-[44px]"
            disabled={importMutation.isPending || selectedRows.length === 0}
            onClick={handleImport}
          >
            {importMutation.isPending && (
              <Icon icon="lucide:loader-2" className="mr-2 h-4 w-4 animate-spin" />
            )}
            {importMutation.isPending
              ? t("import.importing")
              : t("import.cta")}
          </Button>
        )}
      </div>
    </div>
  )
}

function StepsIndicator({ current }: { current: Step }) {
  const { t } = useTranslation()
  const steps: { n: Step; label: string }[] = [
    { n: 1, label: t("import.stepUpload") },
    { n: 2, label: t("import.stepMapping") },
    { n: 3, label: t("import.stepPreview") },
    { n: 4, label: t("import.stepConfirm") },
  ]

  return (
    <div className="flex items-center">
      {steps.map((s, i) => {
        const done = current > s.n
        const active = current === s.n
        return (
          <div key={s.n} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold transition-colors",
                  active && "border-primary bg-primary text-primary-foreground",
                  done && "border-primary bg-primary/10 text-primary",
                  !active && !done && "border-border bg-card text-faint"
                )}
              >
                {done ? <Icon icon="lucide:check" className="h-4 w-4" /> : s.n}
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium",
                  active ? "text-ink" : "text-muted-foreground"
                )}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "mx-2 h-px flex-1",
                  current > s.n ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

type UploadStepProps = {
  fileName: string | null
  fileType: FileType | null
  rowCount: number
  fileInputRef: React.RefObject<HTMLInputElement>
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void
  onChoose: () => void
}

function UploadStep({
  fileName,
  fileType,
  rowCount,
  fileInputRef,
  onFileChange,
  onDrop,
  onChoose,
}: UploadStepProps) {
  const { t } = useTranslation()
  const [dragActive, setDragActive] = useState(false)

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          setDragActive(false)
          onDrop(e)
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-border bg-background"
        )}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Icon icon="lucide:upload-cloud" className="h-7 w-7 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">{t("import.dropHere")}</p>
        <Button className="min-h-[44px]" onClick={onChoose}>
          <Icon icon="lucide:file-up" className="mr-2 h-4 w-4" />
          {t("import.uploadFile")}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          className="hidden"
          onChange={onFileChange}
        />
      </div>

      {fileName && rowCount > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-[13px] border border-success/20 bg-success-soft/40 px-4 py-3">
          <Icon icon="lucide:file-check-2" className="h-5 w-5 text-success" />
          <div className="text-sm">
            <div className="flex items-center gap-2">
              <p className="font-medium text-ink">{fileName}</p>
              {fileType && (
                <Badge
                  variant={fileType === "excel" ? "success" : "info"}
                  className="text-[10px] uppercase"
                >
                  {fileType === "excel" ? "Excel" : "CSV"}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {t("import.rowsParsed", { count: rowCount })}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

type MappingStepProps = {
  headers: string[]
  mapping: ColumnMapping
  setMapping: React.Dispatch<React.SetStateAction<ColumnMapping>>
  amountMode: AmountMode
  setAmountMode: (m: AmountMode) => void
}

function MappingStep({
  headers,
  mapping,
  setMapping,
  amountMode,
  setAmountMode,
}: MappingStepProps) {
  const { t } = useTranslation()

  function updateField(field: keyof ColumnMapping, value: string) {
    setMapping((prev) => ({ ...prev, [field]: value === NONE ? null : value }))
  }

  return (
    <div className="space-y-5">
      <h2 className="text-base font-bold text-ink">{t("import.mapColumns")}</h2>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-text">
          {t("import.amountMode")}
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAmountMode("dual")}
            className={cn(
              "min-h-[44px] rounded-full border px-4 text-sm font-medium transition-colors",
              amountMode === "dual"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-muted text-text"
            )}
          >
            {t("import.dualColumn")}
          </button>
          <button
            type="button"
            onClick={() => setAmountMode("single")}
            className={cn(
              "min-h-[44px] rounded-full border px-4 text-sm font-medium transition-colors",
              amountMode === "single"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-muted text-text"
            )}
          >
            {t("import.singleColumn")}
          </button>
        </div>
      </div>

      <MappingField
        label={t("import.dateColumn")}
        headers={headers}
        value={mapping.date}
        onChange={(v) => updateField("date", v)}
      />

      {amountMode === "single" ? (
        <MappingField
          label={t("import.amountColumn")}
          headers={headers}
          value={mapping.amount}
          onChange={(v) => updateField("amount", v)}
        />
      ) : (
        <>
          <MappingField
            label={t("import.debitColumn")}
            headers={headers}
            value={mapping.debit}
            onChange={(v) => updateField("debit", v)}
          />
          <MappingField
            label={t("import.creditColumn")}
            headers={headers}
            value={mapping.credit}
            onChange={(v) => updateField("credit", v)}
          />
        </>
      )}

      <MappingField
        label={t("import.descColumn")}
        headers={headers}
        value={mapping.description}
        onChange={(v) => updateField("description", v)}
        optional
      />
    </div>
  )
}

type MappingFieldProps = {
  label: string
  headers: string[]
  value: string | null
  onChange: (value: string) => void
  optional?: boolean
}

function MappingField({
  label,
  headers,
  value,
  onChange,
  optional,
}: MappingFieldProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-text">{label}</span>
        {value && !optional && (
          <Badge variant="info" className="text-[10px]">
            {t("import.autoDetected")}
          </Badge>
        )}
      </div>
      <Select value={value ?? NONE} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={t("import.notMapped")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>{t("import.notMapped")}</SelectItem>
          {headers.map((h) => (
            <SelectItem key={h} value={h}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

type PreviewStepProps = {
  previewRows: PreviewRow[]
  accounts: { id: string; name: string }[]
  accountId: string | null
  setAccountId: (id: string) => void
  householdId: string
  categoryGroups: CategoryGroupWithCategories[]
  allSelected: boolean
  selectedCount: number
  totalCount: number
  onToggleAll: () => void
  onToggleRow: (index: number) => void
  onSetCategory: (index: number, categoryId: string) => void
}

function PreviewStep({
  previewRows,
  accounts,
  accountId,
  setAccountId,
  householdId,
  categoryGroups,
  allSelected,
  selectedCount,
  totalCount,
  onToggleAll,
  onToggleRow,
  onSetCategory,
}: PreviewStepProps) {
  const { t } = useTranslation()

  const categoryLookup = useMemo(() => {
    const map: Record<string, { groupName: string; costTypeCode: string | null }> = {}
    for (const group of categoryGroups) {
      for (const cat of group.categories) {
        map[cat.id] = { groupName: group.name, costTypeCode: group.cost_type_code }
      }
    }
    return map
  }, [categoryGroups])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5 sm:max-w-xs sm:flex-1">
          <span className="text-sm font-medium text-text">
            {t("import.account")}
          </span>
          <Select value={accountId ?? undefined} onValueChange={setAccountId}>
            <SelectTrigger>
              <SelectValue placeholder={t("tx.selectAccount")} />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {t("import.selected", { count: selectedCount, total: totalCount })}
          </span>
          <Button
            variant="outline"
            className="min-h-[44px]"
            onClick={onToggleAll}
          >
            {allSelected ? t("import.deselectAll") : t("import.selectAll")}
          </Button>
        </div>
      </div>

      {totalCount === 0 && (
        <p className="rounded-[13px] border border-warning/20 bg-warning-soft/40 px-4 py-3 text-sm text-warning">
          {t("import.noValidRows")}
        </p>
      )}

      <div className="hidden overflow-hidden rounded-[13px] border border-border/40 md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>{t("tx.date")}</TableHead>
              <TableHead>{t("tx.description")}</TableHead>
              <TableHead>{t("tx.category")}</TableHead>
              <TableHead>{t("import.categoryGroup")}</TableHead>
              <TableHead>{t("import.costType")}</TableHead>
              <TableHead className="text-right">{t("tx.amount")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {previewRows.map((row) => {
              const catInfo = row.categoryId ? categoryLookup[row.categoryId] : null
              const needsCategory = row.selected && row.valid && !row.categoryId
              return (
                <TableRow
                  key={row.index}
                  className={cn(
                    !row.valid && "bg-warning-soft/30",
                    needsCategory && "bg-destructive/10 border-destructive/30"
                  )}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      className="h-5 w-5 accent-primary disabled:opacity-40"
                      checked={row.selected}
                      disabled={!row.valid}
                      onChange={() => onToggleRow(row.index)}
                    />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {row.date ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-[280px]">
                    <span className="block text-sm break-all line-clamp-3">
                      {row.description || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="min-w-[180px]">
                    <div className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <CategoryPicker
                          householdId={householdId}
                          direction={row.direction}
                          value={row.categoryId}
                          onChange={(id) => onSetCategory(row.index, id)}
                        />
                      </div>
                      {row.autoMatched && (
                        <Badge
                          variant={row.confidence >= 0.7 ? "success" : "warning"}
                          className="shrink-0 text-[10px]"
                        >
                          {t("import.auto")}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[140px]">
                    {catInfo?.groupName ? (
                      <Badge variant="outline" className="text-[11px]">{catInfo.groupName}</Badge>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="min-w-[120px]">
                    {catInfo?.costTypeCode ? (
                      <Badge variant="secondary" className="text-[11px]">{t(`behavior.${catInfo.costTypeCode}`)}</Badge>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        "font-mono text-sm font-medium tabular-nums",
                        row.direction === "in" ? "text-income" : "text-expense"
                      )}
                    >
                      {row.direction === "in" ? "+" : "-"}
                      {formatVND(row.amount)}
                    </span>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 md:hidden">
        {previewRows.map((row) => {
          const catInfo = row.categoryId ? categoryLookup[row.categoryId] : null
          return (
          <div
            key={row.index}
            className={cn(
              "rounded-[13px] border border-border/40 bg-card p-3",
              !row.valid && "border-warning/40 bg-warning-soft/30"
            )}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 shrink-0 accent-primary disabled:opacity-40"
                checked={row.selected}
                disabled={!row.valid}
                onChange={() => onToggleRow(row.index)}
              />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    {row.date ?? "—"}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-sm font-medium tabular-nums",
                      row.direction === "in" ? "text-income" : "text-expense"
                    )}
                  >
                    {row.direction === "in" ? "+" : "-"}
                    {formatVND(row.amount)}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap break-words">{row.description || "—"}</p>
                {catInfo && (
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-[10px]">{catInfo.groupName}</Badge>
                    {catInfo.costTypeCode && (
                      <Badge variant="secondary" className="text-[10px]">{t(`behavior.${catInfo.costTypeCode}`)}</Badge>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <CategoryPicker
                      householdId={householdId}
                      direction={row.direction}
                      value={row.categoryId}
                      onChange={(id) => onSetCategory(row.index, id)}
                    />
                  </div>
                  {row.autoMatched && (
                    <Badge
                      variant={row.confidence >= 0.7 ? "success" : "warning"}
                      className="shrink-0 text-[10px]"
                    >
                      {t("import.auto")}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          )
        })}
      </div>
    </div>
  )
}

function ConfirmStep({ count, total }: { count: number; total: number }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Icon icon="lucide:database-backup" className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-lg font-bold text-ink">
        {t("import.confirm", { count })}
      </h2>
      <p className="font-mono text-2xl font-bold tabular-nums text-ink">
        {formatVND(total)}
      </p>
    </div>
  );
}
