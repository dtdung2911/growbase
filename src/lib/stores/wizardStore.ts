import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { BUDGET_TEMPLATE } from "@/lib/constants/budgetTemplate"
import type {
  AccountDraft,
  BudgetPctDraft,
  Currency,
  DebtDraft,
  HouseholdType,
  IncomeDraft,
} from "@/types/app"

const DEBT_BUDGET_NAME = "Chi trả nợ"
const PERSONAL_STEP_ORDER = [1, 3, 4, 5, 6, 7] as const
const FAMILY_STEP_ORDER = [1, 2, 3, 4, 5, 6, 7] as const

function initialBudgetPcts(): BudgetPctDraft[] {
  return BUDGET_TEMPLATE.map((line) => ({
    name: line.name,
    budgetPct: line.budgetPct,
    linkedCategoryGroupNames: line.linkedCategoryGroupNames,
    isAutoCalculated: line.isAutoCalculated,
  }))
}

interface WizardStore {
  householdId: string | null
  householdType: HouseholdType | null
  currency: Currency
  currentStep: number
  incomes: IncomeDraft[]
  accounts: AccountDraft[]
  debts: DebtDraft[]
  budgetPcts: BudgetPctDraft[]

  totalSteps: () => number
  stepOrder: () => readonly number[]
  totalIncome: () => number
  debtPct: () => number
  totalBudgetPct: () => number
  canProceed: () => boolean

  next: () => void
  prev: () => void
  setHousehold: (id: string, type: HouseholdType, currency: Currency) => void
  setIncomes: (incomes: IncomeDraft[]) => void
  setAccounts: (accounts: AccountDraft[]) => void
  setDebts: (debts: DebtDraft[]) => void
  setBudgetPct: (name: string, pct: number) => void
  reset: () => void
}

export const useWizardStore = create<WizardStore>()(
  persist(
    (set, get) => ({
      householdId: null,
      householdType: null,
      currency: "VND",
      currentStep: 1,
      incomes: [],
      accounts: [],
      debts: [],
      budgetPcts: initialBudgetPcts(),

      totalSteps: () => (get().householdType === "family" ? 7 : 6),

      stepOrder: () =>
        get().householdType === "personal"
          ? PERSONAL_STEP_ORDER
          : FAMILY_STEP_ORDER,

      totalIncome: () =>
        get().incomes.reduce((sum, i) => sum + (i.monthlyAmount || 0), 0),

      debtPct: () => {
        const income = get().totalIncome()
        if (income === 0) return 0
        const monthly = get().debts.reduce(
          (sum, d) => sum + (d.monthlyPayment || 0),
          0
        )
        return (monthly / income) * 100
      },

      totalBudgetPct: () =>
        get().budgetPcts.reduce((sum, b) => sum + (b.budgetPct || 0), 0),

      canProceed: () => {
        const s = get()
        switch (s.currentStep) {
          case 1:
            return s.householdType !== null
          case 3:
            return s.incomes.length >= 1
          case 4:
            return s.accounts.length >= 1
          case 7:
            return s.totalBudgetPct() <= 100
          default:
            return true
        }
      },

      next: () => {
        const { currentStep, stepOrder } = get()
        const order = stepOrder()
        const idx = order.indexOf(currentStep)
        if (idx >= 0 && idx < order.length - 1) {
          set({ currentStep: order[idx + 1] })
        }
      },

      prev: () => {
        const { currentStep, stepOrder } = get()
        const order = stepOrder()
        const idx = order.indexOf(currentStep)
        if (idx > 0) {
          set({ currentStep: order[idx - 1] })
        }
      },

      setHousehold: (id, type, currency) =>
        set({ householdId: id, householdType: type, currency }),

      setIncomes: (incomes) => set({ incomes }),
      setAccounts: (accounts) => set({ accounts }),

      setDebts: (debts) => {
        set({ debts })
        // BR-BU-002: debts present → 'Chi trả nợ' driven by debtPct(), else keep template value
        const hasDebts = debts.length > 0
        const pct = hasDebts ? get().debtPct() : null
        set((state) => ({
          budgetPcts: state.budgetPcts.map((b) =>
            b.name === DEBT_BUDGET_NAME
              ? {
                  ...b,
                  budgetPct:
                    pct !== null
                      ? Math.round(pct * 100) / 100
                      : BUDGET_TEMPLATE.find((t) => t.name === DEBT_BUDGET_NAME)!
                          .budgetPct,
                }
              : b
          ),
        }))
      },

      setBudgetPct: (name, pct) =>
        set((state) => ({
          budgetPcts: state.budgetPcts.map((b) =>
            b.name === name ? { ...b, budgetPct: pct } : b
          ),
        })),

      reset: () =>
        set({
          householdId: null,
          householdType: null,
          currency: "VND",
          currentStep: 1,
          incomes: [],
          accounts: [],
          debts: [],
          budgetPcts: initialBudgetPcts(),
        }),
    }),
    {
      name: "growbase-wizard",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
