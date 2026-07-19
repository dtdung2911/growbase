import { describe, it, expect } from "vitest"
import { keys } from "@growbase/shared/queryKeys"
import { createFundSchema } from "@growbase/shared/schemas/fund"
import { resolveActiveGoalFund } from "@growbase/shared/rules/resolveActiveGoalFund"
import type { Fund } from "@growbase/shared/types/app"

describe("@growbase/shared exports", () => {
  it("exposes the keys.* factory", () => {
    expect(typeof keys).toBe("object")
    expect(Array.isArray(keys.funds("hh-1"))).toBe(true)
  })

  it("exposes Zod schemas", () => {
    expect(createFundSchema.safeParse({}).success).toBe(false)
  })

  it("exposes pure rules operating on shared types", () => {
    const funds = [{ fund_type: "goal", name: "Nhà", monthly_contribution: 1000 }] as unknown as Fund[]
    expect(resolveActiveGoalFund(funds)?.name).toBe("Nhà")
  })
})
