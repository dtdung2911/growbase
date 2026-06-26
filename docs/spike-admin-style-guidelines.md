# Spike Admin — Style Guidelines

> **Version:** 1.0  
> **Template:** Spike Admin (Next.js + Material UI v5)  
> **Cập nhật:** 2026  
> Tài liệu này mô tả hệ thống thiết kế của template Spike Admin, được trích xuất
> trực tiếp từ giao diện hiện tại. Dùng làm chuẩn tham chiếu cho mọi công việc
> phát triển và thiết kế trên nền template này.

---

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Bảng màu](#2-bảng-màu-color-palette)
3. [Typography](#3-typography)
4. [Spacing System](#4-spacing-system)
5. [Border Radius](#5-border-radius)
6. [Shadows](#6-shadows)
7. [Layout & Structure](#7-layout--structure)
8. [Components](#8-components)
   - 8.1 [Button](#81-button)
   - 8.2 [Input / Form Field](#82-input--form-field)
   - 8.3 [Card](#83-card)
   - 8.4 [Badge & Chip](#84-badge--chip)
   - 8.5 [Table](#85-table)
   - 8.6 [Navigation — Sidebar](#86-navigation--sidebar)
   - 8.7 [Header / AppBar](#87-header--appbar)
   - 8.8 [Avatar & Avatar Group](#88-avatar--avatar-group)
   - 8.9 [Progress Bar](#89-progress-bar)
   - 8.10 [Breadcrumb](#810-breadcrumb)
   - 8.11 [Schedule / Timeline](#811-schedule--timeline)
   - 8.12 [Page Header Banner](#812-page-header-banner)
   - 8.13 [Floating Settings Button](#813-floating-settings-button)
9. [Icons](#9-icons)
10. [Animation & Transitions](#10-animation--transitions)
11. [Data Visualization](#11-data-visualization-charts)
12. [Hình ảnh & Illustration](#12-hình-ảnh--illustration)
13. [Dark Mode](#13-dark-mode)
14. [Responsive & Breakpoints](#14-responsive--breakpoints)
15. [Quy tắc thiết kế chung](#15-quy-tắc-thiết-kế-chung)

---

## 1. Tổng quan

**Spike Admin** là một admin dashboard template hiện đại, xây dựng trên nền tảng
**Material UI (MUI v5)** + **Next.js**. Phong cách thiết kế theo hướng **clean,
light, professional** với các đường cong mềm mại, bóng đổ nhẹ và bảng màu xanh
dương làm chủ đạo.

| Thuộc tính | Giá trị |
|-----------|---------|
| Framework UI | Material UI v5 (MUI) |
| Framework JS | Next.js |
| Font | Plus Jakarta Sans |
| Color scheme | Light (có hỗ trợ Dark mode) |
| Primary color | `#0085DB` |
| Design language | Clean / Rounded / Professional |

---

## 2. Bảng màu (Color Palette)

### 2.1 Brand Colors — Màu chính

| Tên | Hex | RGB | Mô tả |
|-----|-----|-----|--------|
| **Primary** | `#0085DB` | `rgb(0, 133, 219)` | Màu chủ đạo — button, link, accent |
| **Dark Text** | `#111C2D` | `rgb(17, 28, 45)` | Màu chữ chính trên nền trắng |
| **Background** | `#F0F5F9` | `rgb(240, 245, 249)` | Nền tổng thể của layout |
| **White** | `#FFFFFF` | `rgb(255, 255, 255)` | Nền card, sidebar, header |

### 2.2 Semantic Colors — Màu trạng thái

| Tên | Hex | RGB | Dùng cho |
|-----|-----|-----|----------|
| **Success** | `#4BD08B` | `rgb(75, 208, 139)` | Available, tăng trưởng dương |
| **Warning** | `#F8C076` | `rgb(248, 192, 118)` | On Leave, cảnh báo nhẹ |
| **Error / Danger** | `#FB977D` | `rgb(251, 151, 125)` | Absent, giảm, lỗi |
| **Info / Secondary** | `#46CAEB` | `rgb(70, 202, 235)` | Outlined badge, icon phụ |
| **Muted / Gray** | `#707A82` | `rgb(112, 122, 130)` | Text phụ, badge mặc định |

### 2.3 Light Tint Colors — Màu nền nhẹ

Dùng làm background của badge soft, tag, hoặc vùng highlight:

| Tên | Hex | RGB |
|-----|-----|-----|
| Light Blue | `#E5F3FB` | `rgb(229, 243, 251)` |
| Light Green | `#DFFFF3` | `rgb(223, 255, 243)` |
| Light Red | `#FFEDE9` | `rgb(255, 237, 233)` |
| Light Yellow | `#FFF6EA` | `rgb(255, 246, 234)` |
| Border Gray | `#E5EAEF` | `rgb(229, 234, 239)` |
| Light Gray | `#ECF0F1` | `rgb(236, 239, 241)` |
| Input Border | `#DFE5EF` | `rgb(223, 229, 239)` |

### 2.4 Quy tắc sử dụng màu

- **Không tự ý thêm màu mới** ngoài palette đã định nghĩa
- Primary `#0085DB` chỉ dùng cho hành động chính, link active, accent
- Semantic colors phải dùng đúng ngữ nghĩa (xanh lá = thành công, đỏ = lỗi…)
- Tint colors chỉ dùng làm nền nhẹ, không dùng cho text trên nền trắng

---

## 3. Typography

### 3.1 Font Family
Primary: "Plus Jakarta Sans", "Plus Jakarta Sans Fallback", Helvetica, Arial, sans-serif

**Plus Jakarta Sans** là typeface chính — hiện đại, dễ đọc, thân thiện trên màn hình.
Tải từ Google Fonts hoặc nhúng qua `next/font`.

### 3.2 Type Scale

| Variant | Font Size | Font Weight | Line Height | Dùng cho |
|---------|-----------|-------------|-------------|----------|
| `h4` | `21px` | `600` | `25.6px` | Tiêu đề card nổi bật (nền màu) |
| `h5` | `18px` | `600` | `25.6px` | Tiêu đề section / widget |
| `h6` | `14px` | `400` | `24.5px` | Tiêu đề nhỏ trong card |
| `body1` | `14px` | `400` | `21.3px` | Văn bản nội dung chính |
| `body2` | `13px` | `400` | — | Text phụ, label |
| `caption` | `12px` | `400` | `19.9px` | Chú thích, meta info |
| `chip/badge` | `12px` | `600` | — | Nhãn trạng thái |
| `button` | `14px` | `400–500` | `24.5px` | Label trong button |
| `subtitle` | `15px` | `400` | `26.25px` | Nav items, subtitle |
| `overline` | `11px` | `600` | — | Section label (HOME, APPS…) |

### 3.3 Font Weights

Chỉ dùng 4 mức trọng số:

| Weight | Giá trị | Dùng cho |
|--------|---------|----------|
| Regular | `400` | Body text, mô tả, label thường |
| Medium | `500` | Table header, form label |
| SemiBold | `600` | Tiêu đề card, badge, nav item active |
| Bold | `700` | Số liệu KPI nổi bật, logo |

### 3.4 Text Colors

| Ngữ cảnh | Màu |
|---------|-----|
| Chữ chính (trên nền trắng) | `#111C2D` |
| Chữ phụ / placeholder | `#707A82` |
| Link / accent | `#0085DB` |
| Chữ trên nền màu | `#FFFFFF` |
| Error text | `#FB977D` |

---

## 4. Spacing System

Spacing được xây dựng dựa trên bội số của **8px** (MUI default theme spacing).

| Token | Giá trị | Dùng cho |
|-------|---------|----------|
| `xs` | `4px` | Icon margin, gap nhỏ nhất |
| `sm` | `8px` | Padding tag/chip, gap nhỏ |
| `md` | `16px` | Padding nội phần, nav item |
| `lg` | `24px` | Grid gap, padding header |
| `xl` | `30px` | Padding CardContent (top/sides) |
| `xxl` | `48px` | Section spacing |

### Spacing cụ thể theo component

| Component | Spacing |
|-----------|---------|
| CardContent | `padding: 30px 30px 24px` |
| Header Toolbar | `padding: 0 24px` · `height: 64px` |
| Grid gap | `24px` (row & column) |
| Nav item (parent) | `padding: 8px 16px` |
| Nav item (sub) | `padding: 5px 10px 5px 40px` |
| Table cell | `padding: 16px` |
| Input nội dung | `padding: 12px 14px` |
| Page header banner | `padding: 20px 24px` |

---

## 5. Border Radius

| Tên | Giá trị | Dùng cho |
|-----|---------|----------|
| `none` | `0px` | Divider, border thẳng |
| `xs` | `2px` | Đường kẻ vi tế |
| `sm` | `5–6px` | Tag nhỏ, tooltip |
| `md` | `8–10px` | Menu item hover, tab button |
| `lg` | `12–13px` | **Card mặc định** |
| `xl` | `16–18px` | Card nổi bật, Input, Select |
| `chip` | `16px` | Chip / Badge hình viên |
| `button` | `25px` | **Button mặc định** (pill shape) |
| `circle` | `50% / 100%` | Avatar, FAB, icon button |

---

## 6. Shadows

| Cấp độ | Giá trị CSS | Dùng cho |
|--------|-------------|----------|
| **Card (default)** | `rgba(37, 83, 185, 0.1) 0px 2px 6px 0px` | Card, sidebar, header, AppBar |
| **Overlay nhẹ** | `rgba(0, 0, 0, 0.05) 0px 9px 17.5px 0px` | Modal, drawer nhẹ |
| **Elevated** | `rgba(145, 158, 171, 0.3) 0px 0px 2px 0px,`<br>`rgba(145, 158, 171, 0.12) 0px 12px 24px -4px` | Popup, dropdown menu |
| **FAB** | `rgba(37, 83, 185, 0.3) 0px 4px 12px 0px` | Floating action button |

> Toàn bộ shadow mang tông **xanh dương nhạt** (`rgba(37, 83, 185, …)`) để đồng
> bộ với màu primary, tạo cảm giác nhẹ nhàng và có chiều sâu.

---

## 7. Layout & Structure

### 7.1 Layout tổng thể
┌───────────────────────────────────────────────────────┐
│                    Header (AppBar)                    │  height: 64px
│              ┌────────────────────────────────────────┤
│              │                                        │
│   Sidebar    │            Main Content                │
│  (Drawer)    │            (Page area)                 │
│   270px      │   padding: 24px  background: #F0F5F9   │
│              │                                        │
│  ──────────  │                                        │
│  User Card   │                                        │
│  (bottom)    │                                        │
└──────────────┴────────────────────────────────────────┘

### 7.2 Sidebar

| Thuộc tính | Giá trị |
|-----------|---------|
| Width | `270px` |
| Background | `#FFFFFF` |
| Border | Không có |
| Shadow | Card shadow |
| Position | Fixed left |

**Cấu trúc:**
- Logo area (top): icon rocket `32px` + text "Spike Admin" bold
- Scroll area: nhóm điều hướng có section label (HOME, APPS, PAGES, FORMS, TABLES…)
- User card (bottom): avatar + tên + role + logout icon

### 7.3 Header

| Thuộc tính | Giá trị |
|-----------|---------|
| Background | `#FFFFFF` |
| Height | `64px` |
| Box-shadow | Card shadow |
| Padding | `0 24px` |

---

## 8. Components

---

### 8.1 Button

Button là thành phần hành động chính. Có 4 variant: **Contained**, **Outlined**,
**Text**, và **FAB**.

#### Variant: Contained (Filled)

Dùng cho CTA, Submit, Confirm — hành động quan trọng nhất trên trang.
Nền đặc màu, chữ trắng, hình viên thuốc (pill shape).
height (small):   30.75px  |  padding: 4px 10px    |  font-size: 13px
height (medium):  36.5px   |  padding: 6px 16px    |  font-size: 14px  ← mặc định
height (large):   42.25px  |  padding: 7px 21px    |  font-size: 15px
border-radius:    25px (tất cả kích thước)
box-shadow:       none
text-transform:   none (không viết hoa)
font-weight:      400–500

| Màu | Background | Text |
|-----|-----------|------|
| Primary | `#0085DB` | `#FFFFFF` |
| Secondary | `#707A82` | `#FFFFFF` |
| Error | `#FB977D` | `#FFFFFF` |
| Warning | `#F8C076` | `#FFFFFF` |
| Success | `#4BD08B` | `#FFFFFF` |

**State Disabled:** background `rgba(0,0,0,0.12)` · color `rgba(0,0,0,0.26)` · cursor `not-allowed`

**State Loading:** spinner `CircularProgress` (24px) + text mờ, background giữ nguyên màu

#### Variant: Outlined

Dùng cho hành động phụ, không cạnh tranh với CTA chính. Viền màu, nền trong suốt.
border:           1px solid {color}
background:       transparent
border-radius:    25px
padding (medium): 5px 15px
padding (small):  3px 9px
padding (large):  7px 21px
font-size:        14px

Khi có icon đi kèm: icon nằm trái/phải label, cách label `8px`.

#### Variant: Text (Ghost)

Dùng cho link nội tuyến, action trong menu — không có viền, không có nền.
background:    transparent
border:        none
padding:       6px 8px
border-radius: 25px

Hover: background `rgba({color}, 0.04)` — hiệu ứng nhẹ, không thay đổi layout.

#### Variant: FAB (Floating Action Button)

Nút tròn nổi, dùng cho hành động global hoặc hành động nhanh cố định màn hình.
size default:  width: 56px  height: 56px  border-radius: 50%
size small:    width: 40px  height: 40px
size large:    width: 65px  height: 65px
box-shadow:    rgba(37, 83, 185, 0.3) 0px 4px 12px 0px

FAB dùng cùng bảng màu semantic (Primary, Secondary, Warning, Error, Success) làm nền.

#### Button Group

Nhóm nhiều button liền nhau thể hiện lựa chọn liên quan.
Button active: filled màu Primary. Các button còn lại: outlined.
border-radius nhóm: 25px (chỉ bo 2 đầu ngoài cùng)
gap giữa các item:  0px (liền nhau)

---

### 8.2 Input / Form Field

Input sử dụng kiểu **Outlined** của MUI với border-radius lớn tạo cảm giác mềm mại.

#### Cấu trúc giải phẫu
Label (floating above)                   ← font-size: 12px (shrink) / 14px (normal)
color: #707A82
┌──────────────────────────────────────┐
│ [prefix icon]   Input text           │  ← padding: 12px 14px · height: 44px
└──────────────────────────────────────┘
border: 1px solid #DFE5EF · border-radius: 18px
Helper text / Error message            ← font-size: 12px · margin-top: 3px

#### Specs chuẩn

| Thuộc tính | Giá trị |
|-----------|---------|
| Border | `1px solid #DFE5EF` |
| Border-radius | `18px` |
| Height | `44px` |
| Font-size | `14px` |
| Padding nội | `12px 14px` |
| Background | `transparent` |
| Label color | `#707A82` |
| Text color | `#111C2D` |

#### Trạng thái Input

| Trạng thái | Border Color | Mô tả |
|-----------|-------------|--------|
| Default | `#DFE5EF` | Bình thường |
| Focused | `#0085DB` | Đang focus, viền xanh dương |
| Success | `#39CB7F` | Dữ liệu hợp lệ, viền xanh lá |
| Error | `#FB977D` | Dữ liệu không hợp lệ, viền đỏ cam |
| Disabled | `rgba(0,0,0,0.06)` nền | Mờ, không tương tác |

**Error message:** màu `#FB977D` · font-size `12px` · hiển thị bên dưới input.

#### Checkbox & Radio
Kích thước normal:  18px × 18px
Kích thước small:   14px × 14px
Checked color:      #0085DB (primary)
Indeterminate:      dấu gạch ngang (cho parent node khi con chọn một phần)

Màu checkbox theo semantic: Primary (blue), Secondary (gray), Success (green),
Warning (yellow), Error (red).

#### Switch (Toggle)
Track color (off):   rgba(0,0,0,0.38)
Track color (on):    #0085DB với opacity
Thumb (on/off):      #FFFFFF
Transition:          background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1)

#### Select / Dropdown

Kế thừa hoàn toàn style của Outlined Input:
border-radius:   18px
border:          1px solid #DFE5EF
height:          44px
arrow icon:      ExpandMore · 24px · màu #707A82
dropdown menu:   background #FFFFFF · border-radius: 13px
box-shadow: rgba(37,83,185,0.1) 0px 8px 16px
menu item hover: background rgba(0,133,219,0.08)

---

### 8.3 Card

Card là container phổ biến nhất, nhóm thông tin liên quan trong vùng trực quan riêng biệt.

#### Loại 1 — Standard Card (trắng)

Card mặc định cho mọi widget, chart, table.
background:    #FFFFFF
border-radius: 13px
box-shadow:    rgba(37, 83, 185, 0.1) 0px 2px 6px 0px
CardContent:   padding: 30px 30px 24px

**Card Header pattern:**
- Title: font-size `18px` · weight `600` · color `#111C2D`
- Subtitle/date: font-size `13px` · color `#707A82`
- Action button: icon `MoreVert` · `40×40px` · border-radius `100%`

#### Loại 2 — Stat Card (nền màu)

Hiển thị KPI nổi bật trong hero section dashboard.
background:    #0085DB (hoặc semantic colors)
border-radius: 18px
box-shadow:    rgba(37, 83, 185, 0.1) 0px 2px 6px 0px
padding:       24px

Bên trong: icon trắng `30px` + số liệu `font-size: 24px, weight: 700, #FFFFFF`
+ label `12px, rgba(255,255,255,0.7)`. Decoration: hình blob/organic shape nhạt hơn.

#### Loại 3 — Profile / Feature Card

Card giới thiệu nhân vật hoặc feature, có ảnh + badge + title.
border-radius: 18px
padding:       20px 24px
background:    #FFFFFF

Badge phía trên avatar: absolute positioned, pill shape, text ngắn, màu primary.

#### Loại 4 — Widget Card (list)

Card dài ngang, danh sách dữ liệu ngắn. Các row phân tách bằng divider mờ:
divider: 1px solid #E5EAEF
row padding: 12px 0

---

### 8.4 Badge & Chip

Dùng để gắn nhãn trạng thái, phân loại, hoặc đếm số lượng.

#### Kiểu Filled (solid)

Nền màu đặc, chữ trắng. Dùng cho notification count, category tag.
height:         24px
border-radius:  16px
padding:        0 8px
font-size:      12px
font-weight:    600

#### Kiểu Outlined

Viền màu, nền trong suốt. Dùng cho tag phân loại không quá nổi bật.
border:         1px solid rgba({color}, 0.7)
background:     transparent
border-radius:  16px

#### Kiểu Soft / Tinted ← Chuẩn cho Status Badge trong table

Nền màu nhạt (tint) + chữ màu + viền màu tương ứng.

| Status | Nền | Chữ | Viền |
|--------|-----|-----|------|
| Confirmed | `#E5F3FB` | `#0085DB` | `1px solid #0085DB` |
| Active | `#DFFFF3` | `#4BD08B` | `1px solid #4BD08B` |
| Pending | `#FFF6EA` | `#F8C076` | `1px solid #F8C076` |
| Cancelled | `#FFEDE9` | `#FB977D` | `1px solid #FB977D` |
| On Holiday | `#E5F3FB` | `#0085DB` | — |
| On Leave | `#FFF6EA` | `#F8C076` | — |
| Absent | transparent | `#FB977D` | — |
| Available | transparent | `#4BD08B` | — |

#### Notification Badge (MUI Badge)

Chấm hoặc số nổi góc trên-phải của icon (cart, bell).
background:    #FB977D
color:         #FFFFFF
min-width:     20px  |  height: 20px
border-radius: 10px
font-size:     11px  |  font-weight: 600
offset:        top-right 2px 2px

---

### 8.5 Table

Table hiển thị dữ liệu dạng lưới, đặt bên trong Card làm container.

#### Cấu trúc
Card (border-radius: 13px, shadow)
└─ CardContent (padding: 30px 30px 24px)
├─ Card Header: Title + Action button
└─ TableContainer
└─ Table
├─ TableHead
│  └─ TableRow > TableCell (header)
└─ TableBody
└─ TableRow > TableCell (body)

#### Specs Header Row
font-size:      12px
font-weight:    500
color:          #111C2D
padding:        16px
border-bottom:  1px solid #E5EAEF
background:     transparent
text-transform: none

#### Specs Body Row
font-size:     12px
font-weight:   400
color:         #111C2D
padding:       16px
border-bottom: 1px solid #E5EAEF
background:    transparent

#### Pattern hàng dữ liệu phổ biến
[Avatar 40px] [Tên (14px 600) + Role (12px muted)]  |  [Info]  |  [Avatar Group]  |  [Status Chip]  |  [⋮ button]

Thumbnail sản phẩm: `60×40px` · border-radius `6px`.

#### Three-dot Action Button
width: 40px  |  height: 40px
border-radius: 100%
background: transparent
icon: MoreVert (24px)
hover: background rgba(0,0,0,0.04)

---

### 8.6 Navigation — Sidebar

Sidebar là trung tâm điều hướng, luôn hiển thị bên trái trên màn hình lớn.

#### Cấu trúc tổng thể
Sidebar (270px · background: #FFFFFF · box-shadow: card shadow)
│
├─ Logo Area
│   ├─ Icon rocket (32px · màu primary)
│   └─ "Spike Admin" (font-size: 20px · weight: 700)
│
├─ Scroll Area
│   ├─ Section Label  (HOME / APPS / PAGES / FORMS / TABLES…)
│   │   └─ font-size: 11px · weight: 600 · color: #707A82 · UPPERCASE
│   │
│   ├─ Nav Item — Thường
│   │   ├─ Icon (21px · color: #707A82)
│   │   ├─ Label (font-size: 14px · color: #111C2D)
│   │   └─ Badge count (optional · màu #707A82)
│   │
│   ├─ Nav Item — Active
│   │   ├─ Background: rgba(0, 133, 219, 0.08)
│   │   ├─ Border-radius: 18px
│   │   ├─ Icon: #0085DB
│   │   └─ Label: #0085DB · weight: 600
│   │
│   └─ Nav Item — Collapse (có arrow ExpandMore)
│       └─ Sub-item: padding-left 40px · bullet dot 6px · màu #707A82
│
└─ User Card (bottom)
├─ Avatar (40px · circle)
├─ Name (14px · weight: 600)
├─ Role (12px · color: #707A82)
└─ Logout icon →

#### Nav Item Padding
Parent item:  padding: 8px 16px
Sub-item:     padding: 5px 10px 5px 40px

#### Transition Sidebar (collapse/expand)
height:    0.3s cubic-bezier(0.4, 0, 0.2, 1)
transform: 0.225s cubic-bezier(0.4, 0, 0.2, 1)  (drawer open/close)

---

### 8.7 Header / AppBar

Header cố định phía trên, chứa các công cụ điều hướng toàn cục.
background:  #FFFFFF
height:      64px
box-shadow:  rgba(37, 83, 185, 0.1) 0px 2px 6px 0px
padding:     0 24px
position:    fixed top

#### Thứ tự phần tử (trái → phải)

| # | Phần tử | Specs |
|---|---------|-------|
| 1 | Hamburger menu | Icon button `40×40px` · toggle sidebar |
| 2 | Search bar | Outlined pill · icon search trái · width ~240px · placeholder #707A82 |
| 3 | Language selector | Flag icon · circle `32px` |
| 4 | Cart icon | Icon button + Badge `#FB977D` |
| 5 | Dark mode toggle | Moon icon · icon button `40×40px` |
| 6 | Notification bell | Icon button + Badge dot xanh lá |
| 7 | User profile | Avatar `40px` + Tên (14px 600) + Role (12px muted) |

---

### 8.8 Avatar & Avatar Group

#### Single Avatar
shape:      circle (border-radius: 50%)
size xs:    24px × 24px
size sm:    32px × 32px
size md:    40px × 40px  ← mặc định
size lg:    48px × 48px
size xl:    64px × 64px

Khi không có ảnh: hiển thị initial chữ trên nền màu (primary, secondary, hoặc màu ngẫu nhiên từ palette).

#### Avatar Group (stacked)
overlap:         margin-left: -8px (mỗi avatar lệch trái 8px)
border:          2px solid #FFFFFF (viền trắng phân tách)
max hiển thị:    3–4 avatar + chip "+N"
"+N" chip:       background #111C2D · color #FFFFFF · font-size: 12px · border-radius: 50%

---

### 8.9 Progress Bar

#### LinearProgress
height:        6px
border-radius: 6px
track color:   rgba(145, 158, 171, 0.12)
fill color:    #0085DB (primary) hoặc semantic colors
transition:    width 0.4s linear

Màu fill theo context: xanh lá (metrics tốt) · vàng (cảnh báo) · đỏ cam (ngưỡng thấp).

#### LinearProgress có label
Row: [label text (trái, 14px)] ──── [% value (phải, 14px weight 600)]
[bar bên dưới, full width]
gap: 4px giữa label row và bar

---

### 8.10 Breadcrumb

Hiển thị vị trí hiện tại trong cấu trúc điều hướng, xuất hiện trong page header.
font-size:    14px
separator:    "•" (bullet · màu #707A82)
current page: color #111C2D · font-weight: 400
parent link:  color #707A82 · hover: #0085DB · underline on hover

---

### 8.11 Schedule / Timeline

Component lịch dọc, dùng cho widget "Upcoming Schedules".
time labels:  font-size: 12px · color: #707A82 · width: 40px · fixed left
event block:  border-left: 3px solid {color theo loại}
padding: 8px 12px · padding-left: 12px
background: tint màu tương ứng
border-radius: 8px

**Tab selector** ("1 To 3 / 4 To 7 / 8 To 10"):
active:   background #0085DB · color #FFFFFF · border-radius 8px · padding 6px 16px
inactive: background transparent · color #707A82

---

### 8.12 Page Header Banner

Mỗi trang nội dung có banner header riêng, nhất quán xuyên suốt.
background:    #FFFFFF
border-radius: 13px
padding:       20px 24px
box-shadow:    rgba(37, 83, 185, 0.1) 0px 2px 6px 0px
margin-bottom: 24px

**Layout bên trong:** Title `22px, weight 700` (trái) + Breadcrumb (phải), canh giữa dọc.

---

### 8.13 Floating Settings Button

Nút tròn cố định góc dưới-phải, truy cập nhanh cài đặt theme.
position:      fixed · bottom: 24px · right: 24px
background:    #0085DB
color:         #FFFFFF
width/height:  48px × 48px
border-radius: 50%
box-shadow:    rgba(37, 83, 185, 0.3) 0px 4px 12px 0px
icon:          Settings (24px)
z-index:       cao nhất (luôn nổi trên cùng)
animation:     rotate 360deg 1s linear (khi hover)

---

## 9. Icons

### 9.1 Icon Library

Template sử dụng **Material UI SvgIcon** (Material Design Icons) kết hợp với
icon riêng của Spike / Tabler Icons.

### 9.2 Icon Sizes

| Kích thước | Dùng cho |
|-----------|----------|
| `16px` | Icon inline trong text, tag nhỏ |
| `20px` | Icon trong form field, list item |
| `21px` | Nav icon trong sidebar |
| `24px` | Icon chuẩn MUI (default) |
| `30px` | Icon trong stat widget header |

### 9.3 Icon Colors

| Màu | RGB | Dùng cho |
|-----|-----|----------|
| `#111C2D` | rgb(17, 28, 45) | Icon chính trên nền trắng |
| `#707A82` | rgb(112, 122, 130) | Icon muted / inactive |
| `#0085DB` | rgb(0, 133, 219) | Icon active / highlight |
| `#FFFFFF` | rgb(255, 255, 255) | Icon trên nền màu |
| `#4BD08B` | rgb(75, 208, 139) | Icon success |
| `#FB977D` | rgb(251, 151, 125) | Icon warning / error |

### 9.4 Icon Usage Rules

- Luôn canh giữa dọc với text label liền kề
- Kích thước `20–24px` cho icon đứng cạnh text
- Không dùng icon lớn hơn `30px` trong list item
- Icon button phải có vùng tap tối thiểu `40×40px`

---

## 10. Animation & Transitions

### 10.1 Easing Functions

Template sử dụng MUI standard easing xuyên suốt:
cubic-bezier(0.4, 0, 0.2, 1)  — Standard ease (vào nhanh, ra mượt) ← chính
ease-in-out                     — Layout transition chung
ease-in                         — Hiệu ứng xuất hiện
linear                          — Animation quay vòng (spinner)

### 10.2 Duration

| Loại | Thời gian | Dùng cho |
|------|-----------|----------|
| `fast` | `0.1s