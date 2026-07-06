import { beforeEach, describe, expect, it } from "vitest"
import { ONBOARDING_V2_TOTAL_STEPS, useOnboardingV2Store } from "@/lib/stores/onboardingV2Store"
import type { OnboardingGoal } from "@/lib/validations/onboardingV2"

const educationGoal: OnboardingGoal = {
  presetId: "education",
  fundType: "goal",
  name: "Quỹ học cho con",
  targetAmount: 200_000_000,
  targetMonths: 60,
}

const houseGoal: OnboardingGoal = {
  presetId: "house",
  fundType: "goal",
  name: "Mua nhà",
  targetAmount: 500_000_000,
  targetMonths: 36,
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

  it("clearGoals xoá hết goals", () => {
    const store = useOnboardingV2Store
    store.getState().toggleGoal(educationGoal)
    store.getState().clearGoals()
    expect(store.getState().goals).toEqual([])
  })

  it("canProceed step 0 (Hook): luôn true", () => {
    expect(useOnboardingV2Store.getState().canProceed()).toBe(true)
  })

  it("canProceed step 1: true khi goals rỗng (chỉ quỹ khẩn cấp implicit)", () => {
    const store = useOnboardingV2Store
    store.getState().next()
    expect(store.getState().canProceed()).toBe(true)
  })

  it("canProceed step 1: false khi có goal không pass schema", () => {
    const store = useOnboardingV2Store
    store.getState().next()
    store.getState().toggleGoal({ ...educationGoal, targetAmount: null })
    expect(store.getState().canProceed()).toBe(false)
  })

  it("canProceed step 2 (Thu nhập): cần income > 0", () => {
    const store = useOnboardingV2Store
    store.getState().next()
    store.getState().next()
    expect(store.getState().canProceed()).toBe(false)
    store.getState().setMonthlyIncome(30_000_000)
    expect(store.getState().canProceed()).toBe(true)
    store.getState().setMonthlyIncome(0)
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
