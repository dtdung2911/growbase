import { beforeEach, describe, expect, it } from "vitest"
import { ONBOARDING_V2_TOTAL_STEPS, useOnboardingV2Store } from "@/lib/stores/onboardingV2Store"
import type { OnboardingGoal } from "@growbase/shared/schemas/onboardingV2"

const educationGoal: OnboardingGoal = {
  presetId: "education",
  fundType: "goal",
  name: "Quỹ học cho con",
  targetAmount: 200_000_000,
  icon: "ph:graduation-cap-duotone",
}

const houseGoal: OnboardingGoal = {
  presetId: "house",
  fundType: "goal",
  name: "Mua nhà",
  targetAmount: 500_000_000,
  icon: "ph:house-line-duotone",
}

describe("useOnboardingV2Store", () => {
  beforeEach(() => {
    useOnboardingV2Store.getState().reset()
  })

  it("khởi tạo: step 0, goals rỗng, chưa có income", () => {
    const s = useOnboardingV2Store.getState()
    expect(s.step).toBe(0)
    expect(s.goals).toEqual([])
    expect(s.monthlyIncome).toBeNull()
  })

  it("next/prev giữ step trong biên [0, 3]", () => {
    const store = useOnboardingV2Store
    store.getState().prev()
    expect(store.getState().step).toBe(0)
    for (let i = 0; i < 10; i++) store.getState().next()
    expect(store.getState().step).toBe(ONBOARDING_V2_TOTAL_STEPS - 1)
  })

  it("toggleGoal thêm rồi bỏ theo presetId", () => {
    const store = useOnboardingV2Store
    store.getState().toggleGoal(educationGoal)
    store.getState().toggleGoal(houseGoal)
    expect(store.getState().goals.map((g) => g.presetId)).toEqual(["education", "house"])
    store.getState().toggleGoal(educationGoal)
    expect(store.getState().goals.map((g) => g.presetId)).toEqual(["house"])
  })

  it("updateGoal chỉ patch goal trùng presetId", () => {
    const store = useOnboardingV2Store
    store.getState().toggleGoal(educationGoal)
    store.getState().toggleGoal(houseGoal)
    store.getState().updateGoal("house", { targetAmount: 999 })
    expect(store.getState().goals.find((g) => g.presetId === "house")?.targetAmount).toBe(999)
    expect(store.getState().goals.find((g) => g.presetId === "education")?.targetAmount).toBe(200_000_000)
  })

  it("reorderGoals di chuyển goal đúng vị trí, giữ nguyên phần tử", () => {
    const store = useOnboardingV2Store
    const travelGoal: OnboardingGoal = {
      presetId: "travel",
      fundType: "goal",
      name: "Du lịch",
      targetAmount: 30_000_000,
      icon: "ph:airplane-tilt-duotone",
    }
    store.getState().toggleGoal(educationGoal)
    store.getState().toggleGoal(houseGoal)
    store.getState().toggleGoal(travelGoal)
    // kéo hạng 3 (travel, index 2) lên hạng 1 (index 0)
    store.getState().reorderGoals(2, 0)
    expect(store.getState().goals.map((g) => g.presetId)).toEqual(["travel", "education", "house"])
    // không mất/thêm phần tử
    expect(store.getState().goals).toHaveLength(3)
  })

  it("reorderGoals kéo xuống (0 → 2): [A,B,C] → [B,C,A]", () => {
    const store = useOnboardingV2Store
    const travelGoal: OnboardingGoal = {
      presetId: "travel",
      fundType: "goal",
      name: "Du lịch",
      targetAmount: 30_000_000,
      icon: "ph:airplane-tilt-duotone",
    }
    store.getState().toggleGoal(educationGoal)
    store.getState().toggleGoal(houseGoal)
    store.getState().toggleGoal(travelGoal)
    // kéo hạng 1 (education, index 0) xuống hạng 3 (index 2)
    store.getState().reorderGoals(0, 2)
    expect(store.getState().goals.map((g) => g.presetId)).toEqual(["house", "travel", "education"])
    expect(store.getState().goals).toHaveLength(3)
  })

  it("reorderGoals index ngoài biên → no-op", () => {
    const store = useOnboardingV2Store
    store.getState().toggleGoal(educationGoal)
    store.getState().toggleGoal(houseGoal)
    const before = store.getState().goals
    store.getState().reorderGoals(-1, 1)
    store.getState().reorderGoals(0, 5)
    store.getState().reorderGoals(1, 1)
    expect(store.getState().goals).toEqual(before)
  })

  it("clearGoals xoá hết goals", () => {
    const store = useOnboardingV2Store
    store.getState().toggleGoal(educationGoal)
    store.getState().clearGoals()
    expect(store.getState().goals).toEqual([])
  })

  it("canProceed step 0 (Hook): luôn true", () => {
    expect(useOnboardingV2Store.getState().canProceed()).toBe(true)
  })

  it("canProceed step 1 (Thu nhập): cần income > 0", () => {
    const store = useOnboardingV2Store
    store.getState().next()
    expect(store.getState().canProceed()).toBe(false)
    store.getState().setMonthlyIncome(30_000_000)
    expect(store.getState().canProceed()).toBe(true)
    store.getState().setMonthlyIncome(0)
    expect(store.getState().canProceed()).toBe(false)
  })

  it("canProceed step 2 (Mục tiêu): true khi goals rỗng (chỉ quỹ khẩn cấp implicit)", () => {
    const store = useOnboardingV2Store
    store.getState().next()
    store.getState().next()
    expect(store.getState().canProceed()).toBe(true)
  })

  it("canProceed step 2 (Mục tiêu): false khi có goal không pass schema", () => {
    const store = useOnboardingV2Store
    store.getState().next()
    store.getState().next()
    store.getState().toggleGoal({ ...educationGoal, targetAmount: null })
    expect(store.getState().canProceed()).toBe(false)
  })

  it("reset xoá goals + income + step", () => {
    const store = useOnboardingV2Store
    store.getState().next()
    store.getState().toggleGoal(educationGoal)
    store.getState().setMonthlyIncome(30_000_000)
    store.getState().reset()
    const s = store.getState()
    expect(s.step).toBe(0)
    expect(s.goals).toEqual([])
    expect(s.monthlyIncome).toBeNull()
  })

  it("persist vào sessionStorage key growbase-onboarding-v2 với goals", () => {
    useOnboardingV2Store.getState().toggleGoal(educationGoal)
    const raw = sessionStorage.getItem("growbase-onboarding-v2")
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw as string).state.goals[0].presetId).toBe("education")
  })

  it("migrate v0 (shape cũ có `goal` đơn) → reset an toàn về initial", async () => {
    sessionStorage.setItem(
      "growbase-onboarding-v2",
      JSON.stringify({
        version: 0,
        state: { step: 2, goal: { presetId: "house", fundType: "goal" }, monthlyIncome: 5_000_000 },
      })
    )
    await useOnboardingV2Store.persist.rehydrate()
    const s = useOnboardingV2Store.getState()
    expect(s.step).toBe(0)
    expect(s.goals).toEqual([])
    expect(s.monthlyIncome).toBeNull()
  })
})
