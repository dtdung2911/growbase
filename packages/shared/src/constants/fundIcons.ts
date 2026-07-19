// Single source of truth cho icon quỹ — string iconify, render qua <Icon> ở consumer,
// đồng thời persist thẳng vào funds.icon (FundCard render string này sau onboarding).
// Ở lib/constants để cả validations (server) + API route import mà không kéo components tree vào server bundle.
export const PRESET_ICON_NAMES: Record<string, string> = {
  emergency: "stash:shield-duotone",
  sinking: "ph:umbrella-duotone",
  investment: "ph:trend-up-duotone",
  education: "ph:graduation-cap-duotone",
  house: "ph:house-line-duotone",
  travel: "ph:island-duotone",
  custom: "ph:pencil-simple-line-duotone",
};

export const CUSTOM_ICON_CHOICES: string[] = [
  "ph:car-duotone",
  "ph:airplane-tilt-duotone",
  "ph:heart-duotone",
  "ph:baby-duotone",
  "ph:gift-duotone",
  "ph:device-mobile-duotone",
  "ph:briefcase-duotone",
  "ph:diamond-duotone",
  "ph:piggy-bank-duotone",
  "ph:book-duotone",
  "ph:first-aid-kit-duotone",
];

// Whitelist Zod cho onboarding goal.icon (preset strings + custom choices).
export const ICON_CATALOG = [
  ...Object.values(PRESET_ICON_NAMES),
  ...CUSTOM_ICON_CHOICES,
] as [string, ...string[]];
