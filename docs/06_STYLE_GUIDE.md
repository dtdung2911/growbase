# 06 — STYLE GUIDE
> GrowBase Design System | Visual Identity & UI Patterns
> Tham chiếu khi build mọi UI component. Agents đọc file này trước khi viết code frontend.

---

## 1. DESIGN DIRECTION

### Subject & Audience
Family finance app cho hộ gia đình Việt Nam trẻ (25-40 tuổi), 2 thu nhập, dùng mobile hàng ngày để nhập giao dịch < 15 giây. Thay thế Google Sheets — cần cảm giác *có hệ thống, đáng tin, và nhẹ nhàng* thay vì *dashboard doanh nghiệp nặng nề*.

### Personality
- **Professional clarity** — cool blue-gray canvas (`#eef5fb`) with white floating cards, clean surfaces giúp data dễ đọc. Based on Spike Admin Dashboard template
- **Modern precision** — số liệu tài chính cần chính xác với blue primary accent (`#0084DB`). Blue-tinted shadows tạo cohesive feel
- **Structured depth** — thông tin phân cấp rõ ràng bằng spacing, blue-tinted shadows, borders, và typography. Cards with `border-border + shadow-panel`

### Signature Element
**Growth bars** — 3 thanh tăng dần (từ logo mark) là motif xuyên suốt. Xuất hiện trong:
- Logo mark (dùng primary blue color)
- Empty states (subtle watermark)
- Loading skeletons (3 bars animate)
- Progress indicators

---

## 2. COLOR SYSTEM

### Brand Palette — Spike Admin Blue Theme

```
Brand Primary:        #0084DB  hsl(204, 100%, 43%)  — buttons, active states, focus rings, links, brand
Brand Hover:          #006BB8  hsl(205, 100%, 36%)  — hover variant
Brand Pressed:        #004F8A  hsl(206, 100%, 27%)  — pressed/active state
Brand Tint:           #EBF5FF  hsl(210, 100%, 96%)  — active nav bg, badge bg, soft highlights
Dark BG:              #05101A  hsl(209, 68%, 6%)    — dark mode page background

Success:              #49d68d  hsl(149, 62%, 56%)   — income, positive changes
Success soft:         #e5fbef  hsl(147, 65%, 94%)   — success badge bg
Warning:              #ffbd6f  hsl(33, 100%, 72%)   — pending, warnings
Warning soft:         #fff4e4  hsl(36, 100%, 95%)   — warning badge bg
Error:                #ff917d  hsl(9, 100%, 75%)    — expenses, destructive
Error soft:           #fff0ed  hsl(10, 100%, 96%)   — error badge bg
Info:                 #49c8e6  hsl(191, 73%, 59%)   — informational
Info soft:            #e8f8fd  hsl(194, 78%, 95%)   — info badge bg
Violet:               #9b78ff  hsl(256, 100%, 74%)  — accent, savings/investment
```

**Single accent:** Blue is used for both brand identity (logo growth bars, brand marks) and interactive UI (buttons, links, focus, active nav). Clean, professional, cohesive.

### Semantic Colors — Light (default) & Dark

**Light theme (default):**
```
Background:
  Page:             hsl(210, 54%, 96%)      — cool blue-gray canvas (#eef5fb)
  Card:             hsl(0, 0%, 100%)        — pure white, floats on page
  Surface:          hsl(210, 54%, 96%)      — same as page
  Surface-2:        hsl(210, 40%, 97%)      — slightly lighter variant (#f6f9fc)
  Elevated:         hsl(210, 30%, 93%)      — dropdowns, popovers, hover states
  Inset:            hsl(210, 35%, 95%)      — input fields, sunken areas

Border:
  Default:          hsl(212, 45%, 93%)      — light blue-gray (#e5edf6)

Text:
  Ink:              hsl(218, 30%, 16%)      — headings, darkest (#1d2737)
  Text:             hsl(218, 24%, 22%)      — body text (#2a3445)
  Muted:            hsl(215, 15%, 56%)      — secondary text (#7d8b9f)
  Faint:            hsl(215, 17%, 70%)      — tertiary, hints (#a5b1c2)
```

**Dark theme:**
```
Background:
  Page:             hsl(215, 50%, 5%)       — deep blue-gray
  Card:             hsl(215, 35%, 8%)       — raised surface
  Surface:          hsl(215, 30%, 8%)       — matches page area
  Elevated:         hsl(215, 25%, 12%)      — dropdowns, popovers
  Inset:            hsl(215, 30%, 6%)       — sunken areas

Border:
  Default:          hsl(215, 20%, 16%)      — subtle dividers

Text:
  Primary:          hsl(210, 20%, 92%)      — off-white
  Muted:            hsl(215, 15%, 55%)      — secondary
  Faint:            hsl(215, 12%, 38%)      — tertiary
```

**Semantic (cả 2 themes):**
```
Income/Success:   #49d68d — green (same both themes)
Expense/Error:    #ff917d — coral red
Warning:          #ffbd6f — orange
Info:             #49c8e6 — cyan
Violet:           #9b78ff — purple (savings/investment)
```

### Depth Model: Blue-tinted Shadows + Borders

Visual system uses **blue-tinted shadows + subtle borders** for depth, matching Spike Admin template.

```
Cards on page:    shadow-panel + border border-border
Popovers:         shadow-soft-md
Sheets/modals:    shadow-soft-lg
FAB:              shadow-float (blue-tinted: rgba(0, 133, 219, 0.26))
Hover lift:       shadow-panel-hover (upgrade from shadow-panel)
Sidebar:          shadow-sidebar (inset borders + offset shadow)
Topbar:           shadow-topbar (0 8px 24px rgba(29, 77, 124, 0.08))
Inputs:           bg-background, focus glow ring-primary/20
```

Shadow scale (defined in tailwind.config.ts — blue-tinted rgba(29, 77, 124, ...)):
```
shadow-soft-xs:   0 1px 2px — barely perceptible
shadow-soft-sm:   0 1px 3px — list items
shadow-panel:      0 4px 14px — cards (default)
shadow-soft-md:   0 4px 14px — elevated (hover, dropdowns)
shadow-soft-lg:   0 8px 24px — sheets, modals
shadow-panel-hover: 0 12px 20px — card hover state
shadow-float:     0 8px 18px rgba(0,133,219,0.26) — FAB (blue glow)
```

### Theme Switching

- Default: **Light**. User chuyển Dark trong Settings
- Lưu preference vào `localStorage` key `growbase-theme` + Zustand store
- Implementation: `next-themes` provider, `class` strategy trên `<html>`
- Components dùng semantic tokens (`bg-background`, `bg-card`, `text-foreground`) — tự động adapt cả 2 themes
- **KHÔNG hardcode** color values — luôn dùng semantic tokens (`bg-background`, `bg-card`, `text-foreground`)

### Color Usage Rules

- **Blue = unified accent** — dùng cho cả brand (logo, growth bars) và interactive UI (buttons, active nav, focus rings, links). Maps to `bg-primary`, `text-primary`, `bg-primary-soft`
- **Income/Expense** — success green `#49d68d` vs error coral `#ff917d`
- **Soft backgrounds for badges/chips** — `bg-success-soft`, `bg-warning-soft`, `bg-primary-soft` (semantic soft tokens)
- **Text hierarchy** — ink (headings) → text (body) → muted (secondary) → faint (hints) — cùng cool hue, khác lightness
- **Cards always have border + shadow** — `border border-border shadow-panel`, hover `shadow-panel-hover`
- **Buttons are pill-shaped** — `rounded-full`, hover elevation `-translate-y-px`
- **Depth via blue-tinted shadows** — cards/popovers/modals dùng blue-tinted shadows `rgba(29, 77, 124, ...)`, không dùng black-based shadows

---

## 3. TYPOGRAPHY

### Font Stack
```
Display + Body:   Plus Jakarta Sans (Google Fonts)
                  Fallback: Inter, system-ui, -apple-system, sans-serif
Mono (amounts):   JetBrains Mono (Google Fonts)
                  Fallback: ui-monospace, 'SF Mono', monospace
```

**Plus Jakarta Sans** được chọn vì: geometric sans-serif với rounded terminals — friendly cho consumer app, nhưng đủ clean cho data-heavy screens. Cùng family với logo wordmark.

**JetBrains Mono** cho số tiền lớn — tabular figures mặc định, phân biệt rõ 0/O, đọc nhanh khi scan nhiều số.

### Type Scale
```
Display:          text-2xl  font-semibold  tracking-tight     — page hero numbers (tổng thu/chi)
Heading 1:        text-lg   font-semibold                     — page titles
Heading 2:        text-base font-medium                       — section titles
Body:             text-sm   font-normal                       — default content
Body strong:      text-sm   font-medium                       — category names, emphasized items
Caption:          text-xs   font-normal   text-muted          — timestamps, hints
Overline:         text-xs   font-medium   uppercase tracking-wide text-muted — section labels

Amount large:     text-2xl  font-semibold  font-mono          — hero amounts (dashboard cards)
Amount medium:    text-base font-medium    font-mono          — transaction amounts, fund balances
Amount small:     text-sm   font-normal    font-mono          — secondary amounts
```

### Typography Rules
- **Amounts luôn dùng font-mono** — tabular figures giúp các số thẳng hàng trong list
- **Vietnamese diacritics** — Plus Jakarta Sans hỗ trợ tốt Vietnamese. Test: ả, ẵ, ệ, ợ, ừ
- **Letter spacing** — chỉ adjust cho overline (tracking-wide) và display (tracking-tight). Body text giữ default
- **Line height** — Tailwind defaults (leading-normal = 1.5 cho body, leading-tight = 1.25 cho headings)
- **No text-transform ngoài overline** — Vietnamese uppercase có thể gây khó đọc

---

## 4. SPACING & LAYOUT

### Spacing Scale
```
Micro:    4px   (gap-1)    — icon-to-text inline
Small:    8px   (gap-2)    — between related items (label-input)
Medium:   12px  (gap-3)    — between list items
Base:     16px  (gap-4)    — section padding, card padding on mobile
Large:    24px  (gap-6)    — between sections on mobile
XLarge:   32px  (gap-8)    — between major sections, page top padding
```

### Layout Principles
- **Content max-width: 448px (max-w-md)** trên mobile — tránh text lines quá dài
- **Card padding: p-4** mobile, **p-5** desktop — consistent, không quá chật
- **Vertical rhythm: gap-6** giữa sections — đủ breathe, không scattered
- **No nested cards** — surface level tối đa 2 (page → card). Không card-in-card
- **Grid: 1 col mobile, 2 col desktop** cho cards/metrics. Không 3-col trên mobile

### Mobile-First Constraints
```
Viewport:         375px primary
Touch target:     min 44×44px (min-h-[44px] min-w-[44px])
Input font:       16px (text-base) — prevent iOS zoom
Bottom nav:       64px height → pb-16 on all nav pages
FAB position:     fixed bottom-20 right-4
Sheet max height: 85vh, rounded-t-2xl
No horizontal scroll — ever
```

---

## 5. COMPONENT PATTERNS

### Cards
```
Container:        bg-card rounded-2xl shadow-soft p-5 lg:p-6
                  NO border by default — depth via shadow
Hover:            shadow-soft-md transition-shadow duration-150
Active/pressed:   scale-[0.98] transition-transform duration-75
Spacing:          Cards always float on bg-background with gap-4 between them
```

### Buttons
```
Primary:          bg-primary text-primary-foreground hover:bg-primary/90 min-h-[44px]
                  (maps to primary blue in both themes)
Secondary:        bg-secondary text-secondary-foreground hover:bg-secondary/80
Ghost:            bg-transparent text-secondary hover:bg-accent
Destructive:      bg-destructive text-destructive-foreground hover:bg-destructive/90
Disabled:         opacity-50 cursor-not-allowed

All buttons:      rounded-xl font-medium text-sm min-h-[44px] px-4 shadow-soft-xs
Icon buttons:     min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center
```

### Inputs
```
Default:          bg-inset border border-border rounded-xl min-h-[44px] px-3 text-base
Focus:            border-primary ring-1 ring-primary/30
Error:            border-rose-500 ring-1 ring-rose-500/30
Placeholder:      text-muted-foreground
Label:            text-sm font-medium text-secondary mb-1.5
Error message:    text-xs text-rose-400 mt-1
```

### Lists & Items
```
TransactionItem:  flex items-center gap-3 px-4 py-3 min-h-[44px]
                  hover:bg-accent transition-colors rounded-xl
                  Active: bg-accent
Category dot:     w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
Date header:      text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-2 sticky top-0 bg-background/80 backdrop-blur-sm
```

### Badges & Chips
```
Default:          text-xs px-2.5 py-0.5 rounded-full bg-accent text-secondary-foreground
Income:           text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500
Expense:          text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500
Fund type:        text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary
Status active:    text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500
Status warning:   text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500
```

### Progress Bars
```
Track:            h-1.5 rounded-full bg-accent
Fill:             h-1.5 rounded-full transition-all duration-300
Safe fill:        bg-emerald-400
Warning fill:     bg-amber-400
Danger fill:      bg-rose-400
Fund fill:        bg-[fund.color] — each fund has custom color

Thicker variant (fund cards):  h-2 rounded-full
```

### Sheets & Modals
```
Sheet (mobile):   fixed inset-x-0 bottom-0 rounded-t-2xl bg-card shadow-soft-lg max-h-[85vh]
                  Drag handle: w-10 h-1 rounded-full bg-muted mx-auto mt-3
Dialog:           bg-card rounded-2xl shadow-soft-lg p-6 max-w-md mx-auto
Backdrop:         bg-black/40 backdrop-blur-sm
```

### Navigation — Responsive Drawer Pattern

**Mobile (< 1024px): Bottom Nav**
```
Container:        fixed bottom-0 inset-x-0 h-16 bg-card/95 backdrop-blur-md shadow-soft-md
                  NO border-t — shadow provides separation
Nav item:         flex flex-col items-center justify-center min-h-[44px] gap-0.5
Active:           text-primary (blue)
Inactive:         text-muted-foreground
Label:            text-[10px] font-medium
FAB (center):     w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-float -mt-6
Items:            [Dashboard] [Giao dich] [+FAB] [Quy] [Them]
Page padding:     pb-16 (clear bottom nav)
```

**Desktop (>= 1024px): Left Drawer (Sidebar)**
```
Container:        fixed left-0 inset-y-0 w-60 bg-card flex flex-col shadow-soft
                  NO border-r — shadow provides separation
Header:           p-4 — logo mark + "GrowBase" wordmark
Nav section:      flex-1 py-2 — nav items stacked vertically
Footer:           p-4 border-t border-border — user avatar + settings

Nav item:         flex items-center gap-3 px-3 py-2.5 rounded-xl min-h-[44px] text-sm
Active:           bg-primary-soft text-primary font-medium (notch effect on desktop sidebar)
                  + w-1.5 h-1.5 rounded-full bg-primary dot indicator (left edge)
Inactive:         text-muted-foreground hover:bg-accent
Icon:             w-5 h-5

Items:
  Dashboard
  Giao dich
  Quy
  Bao cao
  Ngan sach
  Tai san rong
  Khoan dinh ky
  ────────────
  Cai dat

Page padding:     pl-60 (clear left drawer)
FAB:              fixed bottom-6 right-6 (no center trick)
```

**Active dot indicator:** Mỗi nav item active có dot indicator (w-1.5 h-1.5 bg-primary rounded-full) ở left edge, thay thế cho full-width highlight.

**Transition:** Drawer state không animate — instant show/hide via breakpoint. No hamburger menu.
**Collapsed state:** Không có. Drawer luôn visible trên desktop, luôn bottom nav trên mobile.

---

## 6. MOTION & TRANSITIONS

### Principles
- **Functional, not decorative** — animation phải serve purpose (feedback, orientation, continuity)
- **Fast** — 150ms cho micro-interactions, 200ms cho sheets/modals, 300ms cho page transitions
- **Reduced motion respected** — `prefers-reduced-motion: reduce` → disable all non-essential

### Micro-interactions
```
Button press:     scale-[0.98] duration-75
Hover:            bg-color transition duration-150
Sheet open:       translate-y from 100% duration-200 ease-out
Sheet close:      translate-y to 100% duration-150 ease-in
Toast enter:      translate-y from -100% + opacity from 0 duration-200
List item enter:  opacity from 0 + translate-y from 8px, staggered 30ms per item
Skeleton pulse:   animate-pulse (Tailwind default)
```

### Signature: Growth Bar Loading
```
3 bars animate sequentially:
  Bar 1 (shortest): scale-y from 0 to 1, delay 0ms, duration 300ms
  Bar 2 (medium):   scale-y from 0 to 1, delay 100ms, duration 300ms
  Bar 3 (tallest):  scale-y from 0 to 1, delay 200ms, duration 300ms
Origin: bottom
Easing: cubic-bezier(0.34, 1.56, 0.64, 1) — slight overshoot
Color: primary blue (#0084DB) with opacity progression (0.35, 0.68, 1.0)
```

---

## 7. ICONOGRAPHY

### System
```
Library:          lucide-react
Size default:     w-5 h-5 (20px) — body context
Size small:       w-4 h-4 (16px) — inside buttons, badges
Size large:       w-6 h-6 (24px) — nav items, headers
Stroke width:     1.5 (Lucide default)
Color:            currentColor — inherits from parent text color
```

### Category Group Colors
Category groups dùng đã defined colors trong seed data. Mỗi group có 1 color — dùng cho:
- Category dot (circle avatar in transaction list)
- Chart segments
- Budget progress bar fills

### Fund Icons
Funds dùng emoji icons — user chọn khi tạo fund. Display trong FundCard header.

---

## 8. DATA DISPLAY

### Currency Formatting
```
Vietnamese Dong:  1.234.567 đ    (dots as thousands separator, đ suffix)
US Dollar:        $1,234.57      (commas, 2 decimal places)

Amount display:
  Positive/income:  +1.234.567 đ  text-emerald-400  (hoặc không dấu +)
  Negative/expense: -1.234.567 đ  text-rose-400
  Neutral:          1.234.567 đ   text-primary
```

### Date Formatting
```
Full:             Thứ Hai, 17/06/2026
Short:            17/06
Month:            Tháng 6 / 2026
Relative:         Hôm nay, Hôm qua, 2 ngày trước (trong vòng 7 ngày)
```

### Percentage
```
Budget:           85%  (no decimal)
Savings rate:     23.5%  (1 decimal)
Progress:         67%  (no decimal)
```

### Empty & Zero States
```
Zero amount:      0 đ  (không ẩn, hiển thị bình thường)
No data:          EmptyState component với icon + message + CTA
Loading:          Skeleton (never spinner for page content)
Error:            Toast + keep current UI intact
```

---

## 9. WRITING & COPY

### Voice
- **Direct** — "Thêm giao dịch" không phải "Bạn có thể thêm giao dịch mới"
- **Helpful** — empty states gợi ý hành động, errors giải thích cách fix
- **Consistent** — cùng action = cùng tên xuyên suốt flow. "Lưu" button → "Đã lưu" toast
- **No emoji in body text** — chỉ dùng emoji cho: fund icons (user chọn), empty state illustration

### Button Labels
```
Create:           "Thêm [noun]"         — "Thêm giao dịch", "Thêm quỹ"
Save:             "Lưu"                 — universal save
Confirm:          "Xác nhận"            — irreversible or important actions
Delete:           "Xóa"                 — always in destructive style
Cancel:           "Hủy"                 — always secondary/ghost
Continue:         "Tiếp tục"            — wizard/flow progression
Complete:         "Hoàn thành"          — final step of wizard
```

### Error Messages
```
Validation:       "[Field] không hợp lệ" — specific, not generic
Network:          "Không thể kết nối. Thử lại?"
Permission:       "Bạn không có quyền thực hiện thao tác này"
Not found:        "[Item] không tồn tại"
Server:           "Có lỗi xảy ra. Vui lòng thử lại"
```

### Toast Messages
```
Success:          "Đã [verb]"           — "Đã lưu", "Đã xóa", "Đã nạp quỹ"
Error:            "Không thể [verb]. [reason if known]"
Duration:         Success 2s, Error 5s, Warning 4s
Position:         top-center mobile, bottom-right desktop
```

---

## 10. RESPONSIVE BREAKPOINTS

```
Mobile:           < 640px   — 1 column, bottom nav, sheets
Tablet:           640-1024  — 1-2 columns, bottom nav, sheets
Desktop:          > 1024    — 2 columns, left sidebar (240px), modals/popovers
Max content:      1280px    — centered container

Grid patterns:
  Metric cards:   2 col always (grid-cols-2)
  Fund cards:     1 col mobile → 2 col desktop
  Transaction:    single column always
  Settings menu:  single column always
```

---

## 11. THEME SYSTEM

### Light Default — Dark Toggle in Settings

### Implementation

- Library: `next-themes` (ThemeProvider wraps app)
- Strategy: `class` on `<html>` — Tailwind `darkMode: ["class"]`
- Storage: `localStorage` key `growbase-theme`, values: `light` | `dark` | `system`
- SSR: `suppressHydrationWarning` on `<html>` to avoid flash

### CSS Custom Properties (globals.css)

Dùng HSL format cho tất cả colors qua CSS variables. `:root` = light, `.dark` = dark. Components dùng semantic tokens (`bg-background`, `text-foreground`, `bg-card`) — tự adapt theo theme.

### Rules

- KHÔNG hardcode color values — dùng semantic tokens (`bg-background`, `bg-card`, `bg-surface`, `text-foreground`)
- Exceptions cho hardcoded colors (không đổi theo theme):

```
Primary blue:     bg-primary / text-primary     — maps to #0084DB
Primary soft:     bg-primary-soft               — maps to #e5f3ff (active nav, badge bg)
Income green:     text-income                   — maps to #49d68d
Expense coral:    text-expense                  — maps to #ff917d
Fund colors:      bg-[fund.color]               — dynamic per fund, fallback #0084DB
```

---

## 12. INTERNATIONALIZATION (i18n)

### Vietnamese Default — English Toggle in Settings

### Supported Languages

| Code | Name           | Status           |
|------|----------------|------------------|
| `vi` | Tiếng Việt     | Default, primary |
| `en` | English        | Secondary        |

### i18n Implementation

- Library: `next-intl` (hoặc lightweight custom solution với JSON dict)
- Storage: `localStorage` key `growbase-locale`, values: `vi` | `en`
- HTML lang: `<html lang={locale}>` — dynamic theo setting
- SSR: locale từ cookie/header, client hydrate từ localStorage

### Translation File Structure

```
src/
  messages/
    vi.json        — Vietnamese strings (source of truth)
    en.json        — English translations
```

### Translation Key Convention

```
Namespace theo feature, flat keys:
  "nav.dashboard":          "Tổng quan" / "Dashboard"
  "nav.transactions":       "Giao dịch" / "Transactions"
  "nav.funds":              "Quỹ" / "Funds"
  "tx.addTransaction":      "Thêm giao dịch" / "Add transaction"
  "tx.income":              "Thu nhập" / "Income"
  "tx.expense":             "Chi tiêu" / "Expense"
  "common.save":            "Lưu" / "Save"
  "common.cancel":          "Hủy" / "Cancel"
  "common.delete":          "Xóa" / "Delete"
  "common.confirm":         "Xác nhận" / "Confirm"
  "toast.saved":            "Đã lưu" / "Saved"
  "toast.deleted":          "Đã xóa" / "Deleted"
  "toast.error":            "Có lỗi xảy ra" / "Something went wrong"
  "empty.noTransactions":   "Chưa có giao dịch" / "No transactions yet"
```

### i18n Rules

- Source of truth = `vi.json`. Viết Vietnamese trước, dịch English sau
- Keys dùng camelCase, namespace bằng dot: `feature.keyName`
- Không hardcode text trong components — mọi user-facing string qua translation function `t("key")`
- Exceptions cho hardcoded text: currency symbols (`đ`, `$`), brand name ("GrowBase")
- Date/number formatting: dùng `Intl.DateTimeFormat` / `Intl.NumberFormat` với locale param
- Pluralization: English cần plural rules, Vietnamese không cần (no grammatical plural)

### Date/Number Locale Formatting

```typescript
// Currency
formatCurrency(1234567, "VND", "vi")  → "1.234.567 đ"
formatCurrency(1234567, "VND", "en")  → "1,234,567 đ"

// Date
formatDate(date, "vi")  → "Thứ Hai, 17/06/2026"
formatDate(date, "en")  → "Monday, 06/17/2026"

// Month picker
formatMonth(date, "vi") → "Tháng 6 / 2026"
formatMonth(date, "en") → "June 2026"
```

---

## 13. ACCESSIBILITY

### Minimum Requirements
```
Color contrast:   WCAG AA (4.5:1 text, 3:1 large text)
Focus visible:    ring-2 ring-primary/50 ring-offset-2 ring-offset-background
Keyboard nav:     all interactive elements reachable via Tab
Screen reader:    aria-label on icon-only buttons, aria-live on toasts
Touch targets:    min 44x44px
Font size:        min 12px (text-xs), default 14px (text-sm)
```

### Focus Styles
```css
/* Visible focus ring — only show on keyboard navigation */
/* Uses primary blue accent (--ring maps to primary = #0084DB) */
:focus-visible {
  outline: none;
  ring: 2px solid hsl(var(--ring));
  ring-offset: 2px;
}
```
