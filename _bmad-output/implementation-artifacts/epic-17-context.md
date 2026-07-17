# Epic 17 Context: Glance, Stats, Funds & Budget

<!-- Generated from planning artifacts. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Đem khả năng **tra cứu nhanh khi di động** lên mobile app (RN companion): mở app là liếc được ngay tình hình hôm nay/tháng này, thống kê chi tiêu tháng theo category/group kèm chart, số dư các quỹ, và ngân sách còn lại. Đây là nửa "glance" trong scope v1 = capture + glance — mọi thao tác quản lý nặng (fund ops, cấu hình budget, report chuyên sâu) vẫn ở web; mobile chỉ đọc.

## Stories

- Story 17.1: Home glance
- Story 17.2: Thống kê chi tiêu tháng (chart + budget compare)
- Story 17.3: Xem quỹ (funds)
- Story 17.4: Xem ngân sách (budget)

## Requirements & Constraints

- **Tổng chi tháng:** hiển thị tổng chi tiêu của `currentMonth`.
- **Chi theo category/group:** danh sách + tỉ trọng, kèm biểu đồ — v1 gồm **donut chi theo category** và **bar chi theo group** (chart thống kê tháng cơ bản; report/phân tích chuyên sâu vẫn ở web, không làm ở mobile).
- **Đối chiếu ngân sách:** mỗi budget line hiển thị ngân sách / đã chi / còn lại / % sử dụng + tín hiệu vượt ngưỡng bằng màu semantic.
- **Xem quỹ:** danh sách quỹ đủ 5 loại (emergency/sinking/goal/investment/freedom) với số dư + trạng thái, **nhóm theo loại giống web**. **View-only** — contribute/withdraw giữ ở web v1 (thao tác có RPC + xác nhận, không thuộc "tra cứu nhanh").
- **Budget view-only:** không tạo/sửa budget, không cấu hình money model trên mobile.
- **Offline read:** khi offline vẫn xem được dữ liệu cached, kèm chỉ báo "Số liệu tính đến {time}"; sync không được mất dữ liệu / tạo trùng.
- **Mobile UX floor:** touch target ≥44px, input font ≥16px, safe-area; native feel (không webview).
- **i18n vi/en + light/dark theme**, không hardcode chuỗi/màu.

## Technical Decisions

- **Mọi đọc dữ liệu qua `fetch` tới `/api/*`** (web Next.js) với header `Authorization: Bearer <access_token>`; `supabase-js` trên mobile chỉ dùng cho auth. Không query Supabase data trực tiếp từ client.
- **TanStack Query v5 + Zustand v5**; query keys bắt buộc qua factory `keys.*` từ `packages/shared`; `householdId` + `currentMonth` chỉ lấy từ Zustand store. Types/Zod/rules dùng chung từ `@growbase/shared`, không duplicate.
- **Cache:** query cache persist qua MMKV (`persistQueryClient`), **phân vùng theo `householdId`** — switch household phải purge + invalidate trước khi load household mới; logout clear toàn bộ. Cache theo household là nền cho offline read của các màn glance.
- **Chart lib: `react-native-gifted-charts`** cho donut + bar (đã chốt trong AC story 17.2; ApexCharts là của web, không dùng ở RN).
- **Epic này thuần read-only** → không mutation, không đụng offline queue / Idempotency-Key (chỉ dành cho transaction CRUD); fund RPC là online-only và ngoài scope v1.
- **i18n/theme:** dùng lại catalog string chung + `t()` và theme tokens từ shared; số tiền luôn font mono (JetBrains Mono) + tabular-nums.
- Base URL `/api` lấy từ env config (dev: tunnel/localhost), không hardcode endpoint.

## UX & Interaction Patterns

- **IA:** bottom tab 4 mục + center FAB `+`. **Home** = glance ("hôm nay tiêu được bao nhiêu", tổng chi tháng vs budget, giao dịch gần đây, offline/sync banner). **Stats** = donut theo category, bar theo group, đối chiếu budget. **Menu** → Funds, Budget (cùng switch household, Settings, Logout).
- **Stat card:** số mono lớn + mini chart; chạm → chi tiết. Card radius theo token (data 13px, stat/metric 18px).
- **Loading:** skeleton (list/stat), không spinner toàn màn. **Empty:** minh họa + CTA ghi khoản đầu. **Error:** giữ nguyên + toast.error 5s (nhất quán web).
- **Pull-to-refresh** trên Home (và Stats theo pattern chung Home/Transactions/Stats).
- **Offline:** banner "Đang offline — ghi vẫn lưu, sẽ sync sau"; cached view kèm chỉ báo "Số liệu tính đến {time}".
- Mục "hôm nay tiêu được bao nhiêu" trên Home chỉ hiện **nếu áp dụng** (AC 17.1 ghi rõ "(nếu áp dụng)") — không phải household nào cũng có số này.
- Tín hiệu vượt budget dùng màu semantic (success/warning/error) theo design tokens chung với web.

## Cross-Story Dependencies

- **Phụ thuộc Epic 14–16 (đã xong):** app shell + API client + Bearer auth (14, 15), tab nav + context householdId/currentMonth (15), transaction list + sync chip + persisted cache/cached-read + household-scoped purge (16, đặc biệt 16.4). Home glance (17.1) tái dùng recent transactions + offline/sync banner từ Epic 16, không dựng lại.
- **Trong epic:** 17.1 (tổng chi vs budget) và 17.2/17.4 cùng tiêu thụ dữ liệu chi tiêu tháng + budget line — nên chung endpoint/hook + query keys để cache nhất quán; 17.2 là màn chi tiết của con số 17.1 trỏ tới.
- **Với web:** chỉ cần các route `/api` đọc (transactions/stats/funds/budget) chấp nhận Bearer token qua `withAuth()` — backend touch đã thuộc Epic 14; epic này không thêm backend contract mới.
