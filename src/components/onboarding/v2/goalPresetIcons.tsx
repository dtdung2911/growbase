// Re-export từ src/lib/constants/fundIcons — giữ import path cũ cho các UI consumer
// (GoalStep, TadaStep, FundEditSheet) không vỡ sau khi catalog chuyển sang lib.
export { PRESET_ICON_NAMES, CUSTOM_ICON_CHOICES, ICON_CATALOG } from "@/lib/constants/fundIcons";
