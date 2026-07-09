// Single source of truth cho icon quỹ onboarding — string iconify, render qua <Icon> ở consumer,
// đồng thời persist thẳng vào funds.icon (FundCard render string này sau onboarding).
export const PRESET_ICON_NAMES: Record<string, string> = {
  emergency: "stash:shield-duotone",
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
