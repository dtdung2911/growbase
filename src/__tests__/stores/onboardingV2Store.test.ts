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

describe("useOnboardingV2Store", () => {
  beforeEach(() => {
    useOnboardingV2Store.getState().reset()
  })

  it("khởi tạo: step 0, chưa có goal/income", () => {
    const s = useOnboardingV2Store.getState()
    expect(s.step).toBe(0)
    expect(s.goal).toBeNull()
    expect(s.monthlyIncome).toBeNull()
  })

  it("next/prev giữ step trong biên [0, 3]", () => {
    const store = useOnboardingV2Store
    store.getState().prev()
    expect(store.getState().step).toBe(0)
    for (let i = 0; i < 10; i++) store.getState().next()
    expect(store.getState().step).toBe(ONBOARDING_V2_TOTAL_STEPS - 1)
  })

  it("canProceed step 0 (Hook): luôn true", () => {
    expect(useOnboardingV2Store.getState().canProceed()).toBe(true)
  })

  it("canProceed step 1 (Mục tiêu): false khi chưa chọn, true khi goal hợp lệ", () => {
    const store = useOnboardingV2Store
    store.getState().next()
    expect(store.getState().canProceed()).toBe(false)
    store.getState().setGoal(educationGoal)
    expect(store.getState().canProceed()).toBe(true)
  })

  it("canProceed step 1: false khi goal không pass schema", () => {
    const store = useOnboardingV2Store
    store.getState().next()
    store.getState().setGoal({ ...educationGoal, targetAmount: null })
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

  it("canProceed step 3 (Tada): false — CTA riêng ở story 4.5", () => {
    const store = useOnboardingV2Store
    for (let i = 0; i < 3; i++) store.getState().next()
    expect(store.getState().canProceed()).toBe(false)
  })

  it("reset xoá goal + income + step", () => {
    const store = useOnboardingV2Store
    store.getState().next()
    store.getState().setGoal(educationGoal)
    store.getState().setMonthlyIncome(30_000_000)
    store.getState().reset()
    const s = store.getState()
    expect(s.step).toBe(0)
    expect(s.goal).toBeNull()
    expect(s.monthlyIncome).toBeNull()
  })

  it("persist vào sessionStorage key growbase-onboarding-v2", () => {
    useOnboardingV2Store.getState().setGoal(educationGoal)
    const raw = sessionStorage.getItem("growbase-onboarding-v2")
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw as string).state.goal.presetId).toBe("education")
  })
})
