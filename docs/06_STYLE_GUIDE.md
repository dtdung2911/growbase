# 06 — STYLE GUIDE
> GrowBase Design System | Visual Identity & UI Patterns
> Tham chiếu khi build mọi UI component. Agents đọc file này trước khi viết code frontend.
> **Nguồn sự thật:** `src/app/globals.css` (CSS variables) + `tailwind.config.ts` (token mapping). File này mô tả đúng những gì 2 file đó đang làm — không phải giá trị lý tưởng/dự định. Nếu phát hiện lệch, sửa code hoặc sửa doc ngay, không để lệch kéo dài.

---

## 0. QUY TẮC BẮT BUỘC — ĐỌC TRƯỚC KHI VIẾT CODE

Rule hóa từ 2 lỗi tái diễn nhiều nhất trong Epic 3 (4/6 story lặp lỗi radius, 2 lần lặp lỗi hardcoded color phá dark mode trong cùng 1 review). Đây không phải gợi ý — là gate bắt buộc trước khi tạo card/surface component mới.

### Rule 1 — Radius: dùng đúng bảng, không đoán

`--radius: 0.9375rem` (15px) → scale thật của `rounded-*`:

| Class | Giá trị thật | Dùng cho |
|---|---|---|
| `rounded-sm` | 11px | hiếm dùng |
| `rounded-md` | **13px** | **Data card** — tương đương `rounded-[13px]`, có thể dùng class chuẩn thay vì arbitrary value |
| `rounded-lg` | 15px | mặc định input/control |
| `rounded-xl` | 17px | — |
| `rounded-2xl` | 19px | **KHÔNG dùng cho card thường** — gần nhưng không khớp bất kỳ radius thiết kế nào |
| `rounded-[18px]` | 18px (arbitrary) | **Stat/metric card** — không có bậc scale nào khớp 18px, buộc dùng arbitrary value |

```
❌ BAD
<div className="rounded-2xl border border-border/40 bg-card shadow-card p-4">

✅ GOOD — data card
<div className="rounded-[13px] border border-border/40 bg-card shadow-card p-4">
   (rounded-md cũng ra đúng 13px, dùng được nếu muốn tránh arbitrary value)

✅ GOOD — stat/metric card
<div className="rounded-[18px] border border-border/40 bg-card shadow-card p-4">
```

**Ngoại lệ đã xác nhận:** `.login-card` (login page) dùng `rounded-2xl` có chủ đích — layout wide-container khác biệt, không phải lỗi. Không áp rule này cho login page.

### Rule 2 — Không bao giờ hardcode màu

```
❌ BAD — phá dark mode
<div className="border border-gray-200 bg-gray-50">
<div style={{ background: "#e5edf6" }}>

✅ GOOD — semantic token, tự adapt theme
<div className="border border-border bg-surface">
```

Trước khi dùng bất kỳ màu nào: kiểm tra đã có semantic token trong `globals.css` (`bg-background`, `bg-card`, `bg-surface`, `bg-elevated`, `bg-inset`, `text-foreground`, `text-muted-foreground`, `text-faint`, `border-border`) chưa. Chỉ hardcode hex khi đó là brand-fixed color không đổi theo theme (xem Rule 3).

### Rule 3 — Shadow token: chỉ dùng token có thật, không bịa giá trị

**Token thật sự render shadow** (định nghĩa trong `tailwind.config.ts`, không bị override):
```
shadow-panel        rgba(29, 77, 124, 0.08) 0px 2px 6px
shadow-card-hover   rgba(29, 77, 124, 0.14) 0px 4px 12px
shadow-float        0 8px 18px rgba(0, 132, 219, 0.26)
shadow-topbar       rgba(29, 77, 124, 0.08) 0px 2px 6px
```

**Token bị override — giá trị thật KHÔNG nằm trong tailwind.config.ts:**
```
shadow-card         → định nghĩa lại trong globals.css (xem §2 Depth Model)
```

**Token chết — set "none" trong tailwind.config.ts, dùng KHÔNG có tác dụng gì:**
```
shadow-soft-xs · shadow-soft-sm · shadow-soft · shadow-soft-md · shadow-soft-lg
shadow-panel-hover · shadow-sidebar
```

```
❌ BAD — nghĩ rằng token này tạo shadow 0 8px 24px, thực tế = "none", card không có shadow gì cả
<div className="shadow-soft-lg">

✅ GOOD — dùng token thật, hoặc verify token trong tailwind.config.ts trước khi dùng
<div className="shadow-card">
```

Nếu cần thêm 1 mức shadow mới: sửa `tailwind.config.ts`, xóa token chết liên quan, cập nhật bảng này trong cùng lần sửa — không để token "none" tồn tại song song với token thật cùng tên.

### Rule 4 — Trước khi đánh dấu story/task "done"

- [ ] Không còn `rounded-2xl`/`rounded-3xl` trên card mới, trừ login page.
- [ ] Không còn hex/rgb hardcode ngoài brand-fixed color (Rule 3, §2).
- [ ] Không dùng token shadow trong danh sách "chết" ở trên.
- [ ] Test cả light và dark mode bằng mắt, không chỉ đọc code.

---

## 1. DESIGN DIRECTION

### Subject & Audience
Family finance app cho hộ gia đình Việt Nam trẻ (25-40 tuổi), 2 thu nhập, dùng mobile hàng ngày để nhập giao dịch < 15 giây. Thay thế Google Sheets — cần cảm giác *có hệ thống, đáng tin, và nhẹ nhàng* thay vì *dashboard doanh nghiệp nặng nề*.

### Personality
- **Professional clarity** — cool blue-gray canvas (`#eef5fb`) with white floating cards, clean surfaces giúp data dễ đọc. Based on Spike Admin Dashboard template
- **Modern precision** — số liệu tài chính cần chính xác với blue primary accent (`#0084DB`). Blue-tinted shadows tạo cohesive feel
- **Structured depth** — thông tin phân cấp rõ ràng bằng spacing, blue-tinted shadows, borders, và typography. Cards with `border-border/40 + shadow-card`

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
Brand Tint:           #EBF5FF  hsl(210, 100%, 96%)  — active nav bg, badge bg, soft highlights (= --primary-soft light)
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

Nguồn: `src/app/globals.css` `:root` (light) và `.dark` (dark), verify trực tiếp trong file này nếu nghi ngờ — đây là copy chính xác tại thời điểm viết.

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
  Ink:              hsl(218, 30%, 16%)      — headings, darkest (--card-foreground / --ink)
  Text (foreground):hsl(218, 24%, 22%)      — body text (--foreground, #2a3445)
  Muted:            hsl(215, 15%, 56%)      — secondary text (#7d8b9f)
  Faint:            hsl(215, 17%, 70%)      — tertiary, hints (#a5b1c2)
```

**Dark theme** — *(sửa lại toàn bộ block này trong lần rewrite này — bản cũ ghi `hsl(215,50%,5%)`/`hsl(215,35%,8%)` cho Page/Card, sai hoàn toàn so với `.dark` thật trong globals.css, và tự mâu thuẫn với chính brand palette ở trên):*
```
Background:
  Page:             hsl(209, 68%, 6%)       — #05101A, brand dark bg
  Card:             hsl(209, 45%, 10%)      — raised surface
  Surface:          hsl(215, 30%, 8%)
  Surface-2:        hsl(215, 25%, 10%)
  Elevated:         hsl(215, 25%, 12%)      — dropdowns, popovers
  Inset:            hsl(215, 30%, 6%)       — sunken areas

Border:
  Default:          hsl(215, 20%, 16%)      — subtle dividers

Text:
  Foreground:       hsl(210, 20%, 92%)      — off-white
  Muted:             hsl(215, 15%, 55%)     — secondary
  Faint:             hsl(215, 12%, 38%)     — tertiary

Primary (dark mode dùng primary sáng hơn để đủ contrast trên nền tối):
  Primary:          hsl(204, 90%, 48%)      — không phải hsl(204,100%,43%) như light theme
  Primary hover:    hsl(205, 90%, 42%)
  Primary pressed:  hsl(206, 90%, 34%)
```

**Semantic colors dark theme cũng đổi nhẹ** (bão hòa/độ sáng giảm để không chói trên nền tối) — không dùng chung 1 giá trị cho cả 2 theme:
```
Success dark:  hsl(149, 50%, 42%)   Warning dark: hsl(33, 80%, 55%)
Error dark:    hsl(9, 70%, 55%)     Info dark:    hsl(191, 60%, 45%)
Violet dark:   hsl(256, 70%, 60%)
```
→ Đây chính là lý do KHÔNG được hardcode `text-[#49d68d]` — giá trị đúng cho dark mode khác giá trị light mode. Luôn dùng `text-success`, không dùng hex trực tiếp.

### Depth Model: Blue-tinted Shadows + Borders

**Token thật sự có tác dụng** (verify trong `tailwind.config.ts`, không bị override):
```
shadow-panel         rgba(29, 77, 124, 0.08) 0px 2px 6px    — panel/section (không phải card có border)
shadow-card-hover    rgba(29, 77, 124, 0.14) 0px 4px 12px   — hover state upgrade
shadow-float         0 8px 18px rgba(0, 132, 219, 0.26)     — FAB, blue glow
shadow-topbar        rgba(29, 77, 124, 0.08) 0px 2px 6px    — topbar desktop
```

**`shadow-card` — token bị override, KHÔNG dùng giá trị trong tailwind.config.ts:**

`tailwind.config.ts` khai báo `boxShadow.card = "rgba(37, 83, 185, 0.1) 0px 2px 6px"`, nhưng giá trị này **không bao giờ áp dụng**. `globals.css` định nghĩa lại `.shadow-card` bằng CSS đặt ngoài mọi `@layer` (unlayered) — theo spec CSS Cascade Layers, CSS unlayered luôn thắng CSS trong layer (kể cả Tailwind's `utilities` layer), bất kể thứ tự khai báo hay specificity. Giá trị thật đang render:

```css
.shadow-card {
  border: 1px solid hsl(var(--border));
  box-shadow:
    -10px 10px 6px hsl(var(--border) / 10%),
    0 10px 6px hsl(var(--border) / 3%),
    0 -1px 6px hsl(var(--border) / 10%);
}
```

Class `.login-card` dùng CSS giống hệt (duplicate) — tech debt đã track ở `_bmad-output/implementation-artifacts/deferred-work.md`, chưa gộp lại.

**Token chết — set `"none"` trong `tailwind.config.ts`, dùng không có tác dụng gì cả:**
```
shadow-soft-xs · shadow-soft-sm · shadow-soft · shadow-soft-md · shadow-soft-lg
shadow-panel-hover · shadow-sidebar
```
Những class này vẫn compile hợp lệ (không lỗi TypeScript/build) nên rất dễ dùng nhầm — component sẽ mất shadow hoàn toàn mà không có cảnh báo nào. Nếu thấy 1 card "phẳng lì" không có bóng, kiểm tra ngay có đang dùng 1 trong các token chết này không.

```
Popovers/dropdowns: dùng shadow-panel hoặc shadow-card, KHÔNG dùng shadow-soft-md (chết)
Sheets/modals:      dùng shadow-card hoặc shadow-card-hover, KHÔNG dùng shadow-soft-lg (chết)
FAB:                shadow-float (blue-tinted glow, sống)
Sidebar:             không có shadow (shadow-sidebar = none, đây là chủ đích — sidebar flush, không nổi)
Inputs:              bg-background, focus glow ring-primary/20 (không dùng shadow)
```

### Theme Switching

- Default: **Light**. User chuyển Dark trong Settings
- Lưu preference vào `localStorage` key `growbase-theme` + Zustand store
- Implementation: `next-themes` provider, `class` strategy trên `<html>`
- Components dùng semantic tokens (`bg-background`, `bg-card`, `text-foreground`) — tự động adapt cả 2 themes
- **KHÔNG hardcode** color values — luôn dùng semantic tokens (`bg-background`, `bg-card`, `text-foreground`)

### Color Usage Rules

- **Blue = unified accent** — dùng cho cả brand (logo, growth bars) và interactive UI (buttons, active nav, focus rings, links). Maps to `bg-primary`, `text-primary`, `bg-primary-soft`
- **Income/Expense** — success green `text-success` vs error coral `text-error` (không hardcode hex — khác giá trị theo theme, xem block Dark theme ở trên)
- **Soft backgrounds for badges/chips** — `bg-success-soft`, `bg-warning-soft`, `bg-primary-soft` (semantic soft tokens)
- **Text hierarchy** — ink (headings) → text/foreground (body) → muted (secondary) → faint (hints) — cùng cool hue, khác lightness
- **Cards always have border + shadow** — `border border-border/40 shadow-card` (xem §5 Cards để biết rule radius/border chính xác)
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
Base:     16px  (gap-6)    — section padding, card padding on mobile
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
Data card:        rounded-[13px] border border-border/40 bg-card shadow-card p-4
Stat/metric card: rounded-[18px] border border-border/40 bg-card shadow-card p-4
Hover:            hover:shadow-md transition-shadow — use on clickable cards
Animation:        card-enter 400ms (triggered automatically by .shadow-card CSS selector in globals.css)
Spacing:          gap-6 between cards, always on bg-background canvas
```

`shadow-card` thật sự bao gồm cả border riêng của nó (`border: 1px solid hsl(var(--border))`, full opacity) — xem §2 Depth Model. Class `border border-border/40` trong markup vẫn nên giữ để component tự đứng được nếu sau này `.shadow-card` đổi, nhưng lưu ý 2 khai báo border đang chồng lên nhau; không phải bug cần fix ngay, chỉ cần biết để không ngạc nhiên khi inspect DOM thấy border full-opacity thay vì /40.

```
❌ BAD
<div className="rounded-2xl border border-border shadow-panel p-4">

✅ GOOD — data card
<div className="rounded-[13px] border border-border/40 bg-card shadow-card p-4">

✅ GOOD — stat/metric card
<div className="rounded-[18px] border border-border/40 bg-card shadow-card p-4">
```

**NO:** `rounded-2xl`/`rounded-3xl` (trừ login page, xem §0 Rule 1) · `shadow-panel` cho card có border (dùng cho panel/section không có border riêng) · shadow token trong danh sách "chết" ở §2.

### Buttons
```
Primary:          bg-primary text-primary-foreground hover:bg-primary/90 min-h-[44px]
                  (maps to primary blue in both themes)
Secondary:        bg-secondary text-secondary-foreground hover:bg-secondary/80
Ghost:            bg-transparent text-secondary hover:bg-accent
Destructive:      bg-destructive text-destructive-foreground hover:bg-destructive/90
Disabled:         opacity-50 cursor-not-allowed

All buttons:      rounded-full font-semibold text-sm min-h-[44px] px-5
                  hover:brightness-[0.8] active:brightness-[0.6]
Icon buttons:     min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center
```

### Inputs
```
Default:          bg-background border border-border rounded-[18px] h-[44px] px-4 text-base
Focus:            border-primary ring-2 ring-primary/20 (focus-visible)
Error:            aria-invalid → border-destructive ring-destructive/20
Placeholder:      text-faint
Label:            text-sm font-medium mb-1.5
Error message:    text-xs text-destructive mt-1
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
Base:             min-h-[24px] rounded-[16px] text-xs font-semibold leading-none px-2.5 py-0.5
Pattern:          bg-{color}/10 text-{color} border border-{color}/30  ← tinted + border

Variants (Badge component, src/components/ui/badge.tsx):
  default:        bg-primary/10 text-primary border border-primary/30
  info:           bg-info/10 text-info border border-info/30
  success:        bg-success/10 text-success border border-success/30
  warning:        bg-warning/10 text-warning border border-warning/30
  error:          bg-error/10 text-error border border-error/30
  destructive:    alias của error — cùng class, giữ tên riêng cho tương thích shadcn convention
  violet:         bg-violet/10 text-violet border border-violet/30
  secondary:      bg-secondary text-secondary-foreground (no border, neutral)
                  (--secondary và --muted hiện có cùng giá trị HSL, nhưng dùng đúng class secondary — không đổi thành bg-muted)
  outline:        border border-border text-foreground (no fill, transparent bg)

Behavior type map:
  fixed → default · variable → success · wasteful → warning
  debt_repayment → error · savings_investment → violet

NO: rounded-full · bg-emerald-* · bg-rose-* · bg-amber-* · bg-blue-* (hardcoded)
```

### Progress Bars
```
Track:            h-1.5 rounded-full bg-accent
Fill:             h-1.5 rounded-full transition-all duration-300
Safe fill:        bg-success
Warning fill:     bg-warning
Danger fill:      bg-error
Fund fill:        bg-[fund.color] — each fund has custom color

Thicker variant (fund cards):  h-2 rounded-full
```

### Sheets & Modals
```
Sheet (mobile):   fixed inset-x-0 bottom-0 rounded-t-2xl bg-card shadow-card max-h-[85vh]
                  Drag handle: w-10 h-1 rounded-full bg-muted mx-auto mt-3
Dialog:           bg-card rounded-2xl shadow-card p-6 max-w-md mx-auto
Backdrop:         bg-black/40 backdrop-blur-sm
```
*(sửa `shadow-soft-lg` → `shadow-card`: `shadow-soft-lg` là token chết, không render gì — xem §2)*

### Navigation — Responsive Drawer Pattern

**Mobile (< 1024px): Bottom Nav**
```
Container:        fixed bottom-0 inset-x-0 h-16 bg-card/95 backdrop-blur-md border-t border-border
                  (shadow-soft-md là token chết — dùng border-t để tạo separation thay vì trông chờ shadow)
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
Container:        fixed inset-y-0 z-40 w-[272px] bg-card flex flex-col (shadow-sidebar = none, chủ đích)
                  Flush full-height — NO rounded corners, NO float
Brand:            px-6 pb-16 pt-16 — 3-bar logo mark + "GrowBase" wordmark
                  sidebar-nav-brand CSS → border-right on brand area

Nav:              sidebar-nav CSS class — grouped sections (main, analytics, settings)
                  pl-5, sections labeled text-[11px] uppercase tracking-wider muted
                  sidebar-nav-paragraph CSS → border-right on section labels + spacing

Nav item:         sidebar-nav-link — pill shape rounded-[999px]
                  flex items-center gap-3 px-4 py-2.5 min-h-[44px] text-[14px] font-semibold
                  margin-right: 16px (right gap), text-muted-foreground
                  sidebar-nav-div[data-active=false] → border-right (normal items)

Active (CSS):     sidebar-nav-link[data-active=true] →
                  extends to right edge (margin-right: 0), rounded-left pill (999px 0 0 999px)
                  bg: hsl(var(--background)), text: primary, border top+bottom
                  ::before/::after → curved corner cutouts using box-shadow trick

Hover:            color: primary, background: primary-soft

User card:        mx-5 mb-5 mt-3 — rounded-2xl bg-primary-soft p-3.5
                  Avatar (h-10 w-10 rounded-full bg-primary) + name + logout icon

Page padding:     pl-[var(--sidebar-width)] (272px)
```

**Transition:** Drawer state không animate — instant show/hide via lg: breakpoint. No hamburger.
**Collapsed state:** Không có. Drawer luôn visible trên desktop, luôn bottom nav trên mobile.

**TopHeader** *(verify trực tiếp trong `TopHeader.tsx` — không có `rounded-2xl` float nào trên desktop tại thời điểm viết, khớp với rule dưới đây)*
```
Mobile:           bg-card lg:border-b — flat, no rounding
                  (shadow-soft-xs đang được áp trong code nhưng là token chết — không tạo shadow gì cả,
                   phần "flat" thực chất chỉ nhờ lg:border-b, không nhờ shadow)
Desktop:          lg:border-b header-custom (CSS class)
                  header-custom::before → notch decorator trên left (align với sidebar bottom)
Height:           72px (--topbar-height CSS var)
Content left:     month picker ([←] Tháng M/YYYY [→])
Content right:    theme toggle + language toggle + notification bell + user pill
User pill:        rounded-xl bg-surface px-2 py-1.5 pr-3.5

NO:               rounded-2xl float style on desktop — TopHeader is flush, NOT floating
```

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
  Positive/income:  +1.234.567 đ  text-success  (hoặc không dấu +)
  Negative/expense: -1.234.567 đ  text-error
  Neutral:          1.234.567 đ   text-primary
All amounts:      font-mono tabular-nums
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
Desktop:          > 1024    — 2 columns, left sidebar (272px), modals/popovers
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
- Exceptions cho hardcoded colors (không đổi theo theme — nhưng ngay cả các exception này nên đi qua token, không viết hex trực tiếp trong component):

```
Primary blue:     bg-primary / text-primary     — maps to #0084DB light / lighter hsl(204,90%,48%) dark
Primary soft:     bg-primary-soft               — maps to #EBF5FF light, dark có giá trị riêng (--primary-soft dark = hsl(204,40%,14%))
Income green:     text-income                   — maps to --success (khác giá trị light/dark, xem §2)
Expense coral:    text-expense                  — maps to --error (khác giá trị light/dark, xem §2)
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
/* Uses primary blue accent (--ring maps to primary) */
:focus-visible {
  outline: none;
  ring: 2px solid hsl(var(--ring));
  ring-offset: 2px;
}
```
