---
title: "DESIGN — GrowBase Mobile"
status: final
created: 2026-07-15
updated: 2026-07-15
colors:
  brand: "#0084DB"
  brand_hover: "#006BB8"
  brand_pressed: "#004F8A"
  brand_tint: "#EBF5FF"
  background: "#EEF5FB"
  card: "#FFFFFF"
  dark_bg: "#05101A"
  ink: "#1D2737"
  text: "#2A3445"
  muted: "#7D8B9F"
  faint: "#A5B1C2"
  border: "#E5EDF6"
  success: "#49D68D"
  warning: "#FFBD6F"
  error: "#FF917D"
  info: "#49C8E6"
  violet: "#9B78FF"
typography:
  body: "Plus Jakarta Sans"
  mono: "JetBrains Mono"
rounded:
  data_card: "13px"
  stat_card: "18px"
  input: "18px"
  button: "9999px"
  sheet: "24px"
spacing:
  touch_target: "44px"
  input_height: "44px"
  screen_padding: "16px"
components:
  button: "pill, brand fill, hover brightness 0.8"
  input: "h-44 rounded-18 border, focus ring brand/20"
  fab: "56px circle, brand fill, shadow-float, center bottom nav"
---

# DESIGN — GrowBase Mobile

## Brand & Style
Kế thừa nguyên identity web GrowBase (Spike Admin, brand xanh dương `#0084DB`). Cảm giác: sạch, tin cậy, "fintech gia đình" — không nghiêm trọng. Mobile ưu tiên **thoáng, số to dễ đọc, chạm nhanh**. Amounts luôn `JetBrains Mono` tabular-nums.

## Colors
- **Brand:** `{colors.brand}` · hover `{colors.brand_hover}` · pressed `{colors.brand_pressed}` · tint `{colors.brand_tint}`.
- **Surfaces:** background `{colors.background}` (light) / `{colors.dark_bg}` (dark) → card `{colors.card}` nổi trên nền → sheet/elevated.
- **Text:** ink `{colors.ink}` (heading) · text `{colors.text}` (body) · muted `{colors.muted}` · faint `{colors.faint}`.
- **Semantic:** success `{colors.success}` · warning `{colors.warning}` · error `{colors.error}` · info `{colors.info}` · violet `{colors.violet}`. Dùng cho tín hiệu vượt budget, sync status.
- **Border:** `{colors.border}`.
- Light mặc định, dark toggle. Không hardcode — token hóa.

## Typography
- Body/UI: `{typography.body}`.
- **Amounts/số tiền: `{typography.mono}` + tabular-nums** (nhất quán web).
- Hierarchy mobile: số dư/tổng chi = lớn nổi bật; label = muted nhỏ.

## Layout & Spacing
- Screen padding `{spacing.screen_padding}`.
- **Touch target ≥ `{spacing.touch_target}`** mọi phần tử chạm được.
- Input height `{spacing.input_height}`, font ≥ 16px (chống zoom iOS).
- Safe-area/notch aware; bottom nav + FAB tôn trọng home-indicator.

## Elevation & Depth
- `shadow-card`: `rgba(37,83,185,0.1) 0 2px 6px` — card dữ liệu.
- `shadow-float`: `rgba(0,133,219,0.26) 0 8px 18px` — FAB, bottom sheet.

## Shapes
- Data card `{rounded.data_card}` · stat/metric card `{rounded.stat_card}` · input `{rounded.input}` · button pill `{rounded.button}` · bottom sheet top `{rounded.sheet}`.

## Components
- **Button:** `{components.button}`.
- **Input:** `{components.input}`; amount input dùng native number keypad.
- **FAB:** `{components.fab}` — hành động Add-transaction, nổi giữa bottom nav.
- **Bottom nav:** 4 tab, active = brand + label; icon @iconify tương đương web.
- **Stat card:** rounded-18, số mono lớn, mini donut/bar (gifted-charts).
- **Sync chip:** pill nhỏ — pending (muted), synced (success), error (error).

## Do's and Don'ts
- ✅ Số tiền mono tabular-nums. ✅ Chạm ≥44px. ✅ Token hóa màu (light/dark).
- ❌ Không hardcode màu/chuỗi. ❌ Không nhồi thao tác nặng (budget config) vào mobile. ❌ Không cảm giác "web bọc app" — dùng native primitives.
