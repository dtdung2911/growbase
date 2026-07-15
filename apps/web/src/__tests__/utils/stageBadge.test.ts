import { describe, it, expect } from "vitest"
import { stageBadgeContent } from "@growbase/shared/rules/stageBadge"

describe("stageBadgeContent (story 13.1 D1)", () => {
  it("GĐ1 với stage1EndMonth N → months, dùng stage1End", () => {
    expect(stageBadgeContent(1, 5, 12)).toEqual({ kind: "months", stage: 1, months: 5 })
  })

  it("GĐ2 với stage2EndMonth N → months, dùng stage2End (không phải stage1End)", () => {
    expect(stageBadgeContent(2, 3, 8)).toEqual({ kind: "months", stage: 2, months: 8 })
  })

  it("GĐ3 → dream (không số), bỏ qua stage ends", () => {
    expect(stageBadgeContent(3, 1, 2)).toEqual({ kind: "dream" })
  })

  it("GĐ1 stage end null → plain (chỉ GĐ1)", () => {
    expect(stageBadgeContent(1, null, null)).toEqual({ kind: "plain", stage: 1 })
  })

  it("GĐ2 stage2End null → plain", () => {
    expect(stageBadgeContent(2, 4, null)).toEqual({ kind: "plain", stage: 2 })
  })

  it("stage end 0 (đã đạt / phòng thủ) → plain, không '~0 tháng'", () => {
    expect(stageBadgeContent(1, 0, 0)).toEqual({ kind: "plain", stage: 1 })
    expect(stageBadgeContent(2, 6, 0)).toEqual({ kind: "plain", stage: 2 })
  })
})
