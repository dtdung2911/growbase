---
stepsCompleted: [step-01, step-02, step-03, step-04]
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-onboarding-v2-2026-07-02/prd.md
  - _bmad-output/planning-artifacts/prds/prd-onboarding-v2-2026-07-02/addendum.md
  - _bmad-output/planning-artifacts/prds/prd-growbase-2026-06-26/prd.md
  - _bmad-output/planning-artifacts/architecture/architecture-growbase-2026-06-27/ARCHITECTURE-SPINE.md
  - _bmad-output/design-thinking-2026-07-02.md
  - docs/05_UX_SPEC.md
  - docs/06_STYLE_GUIDE.md
  - _bmad-output/implementation-artifacts/deferred-work.md
---

# GrowBase — Onboarding v2 & Goal-driven Narrative — Epic Breakdown

## Overview

Tài liệu này breakdown epics và stories cho PRD "Onboarding v2 & Goal-driven Narrative" (02-07-2026), merge với requirements nền từ PRD v1 "Chuẩn Hóa UI & Xác Nhận Luồng Nghiệp Vụ" (26-06-2026) và Architecture Spine. Output file riêng — `epics.md` cũ (Epics 1-3, đã hoàn thành + retro 02-07-2026) giữ nguyên làm lịch sử.

## Requirements Inventory

### Functional Requirements

**Nhóm A — PRD v1 (đã implement qua Epics 1-3 trong `epics.md`, retro 02-07-2026 — liệt kê làm nền/invariant, KHÔNG tạo story mới trừ khi regression):**

V1-FR1: Design tokens Spike Admin trên tất cả screens/components
V1-FR2: Zero hard-coded colors — tất cả qua CSS variables/Tailwind tokens
V1-FR3: Card chuẩn — radius 13px + shadow-card; stat card 18px
V1-FR4: Button chuẩn — 44px (md), pill radius, hover/active/disabled states
V1-FR5: Input chuẩn — 44px, radius 18px, focus/error states, floating label
V1-FR6: Badge chuẩn — 24px, radius 16px, tinted background
V1-FR7: Table chuẩn — trong Card 13px, header/body font spec
V1-FR8: Page Header Banner mỗi trang
V1-FR9: Animation & transitions đúng spec (cubic-bezier, 250ms)
V1-FR10: `prefers-reduced-motion` support
V1-FR11: Dark mode hoàn chỉnh (next-themes + CSS variables)
V1-FR12: 10-point checklist pass mọi screen
V1-FR13: `/api/household` + `/api/households` dùng `withAuth()` + response shape chuẩn
V1-FR14: Household membership double guard (AD-6) trên mọi route

**Nhóm B — PRD Onboarding v2 (scope active của breakdown này):**

**F1 — Onboarding 4 bước "mở quà" (thay thế hoàn toàn wizard 7 bước)**

FR1: Màn Hook hiển thị dashboard demo "nhà Minnie" — dữ liệu tĩnh, render client-side, không ghi database. Ranh giới demo/thật hiển thị thường trực; CTA chính "Đến lượt nhà bạn"; có nút "Bỏ qua" đi thẳng FR2.
FR2: Màn Mục tiêu: chọn đúng **một** mục tiêu từ danh sách gợi ý kèm số mặc định thông minh: 🛡️ Quỹ khẩn cấp (3 × chi tiêu tháng, tự tính sau khi có thu nhập), 🎓 Quỹ học cho con (200tr/5 năm), 🏠 Mua nhà (500tr/3 năm), ✈️ Du lịch gia đình (30tr/1 năm), ✏️ Tự nhập (tên + số đích + thời hạn). Số mặc định sửa được ngay tại chỗ. Bước này **bắt buộc** — không có lối "để sau".
FR3: Màn Thu nhập: một trường duy nhất — thu nhập hàng tháng của hộ, gắn nhãn household income, không gắn vào cá nhân người nhập. Validation: bắt buộc > 0.
FR4: Màn Tada: từ 2 input trên, app tự tạo (a) household 1 thành viên — không hỏi "Loại hộ"; (b) tài khoản mặc định "Tài khoản chính"; (c) bộ categories + budget mặc định từ seed 38 categories — số tiền budget **scale theo thu nhập** đã nhập; (d) goal fund thật từ FR2; (e) kết luận khả thi: `(đích − 0) / số tháng` so với `thu nhập − tổng budget`, hiển thị "khả thi ✓" hoặc gợi ý điều chỉnh (giảm đích / kéo dài thời hạn); (f) con số "hôm nay còn X đ chi tiêu thoải mái".
FR5: Không còn bước Mời thành viên, Tài khoản, Nợ, Categories, Budget trong onboarding. Nợ và tài khoản bổ sung khai báo sau trong app.
FR6: Toàn bộ onboarding hoàn thành được dưới 3 phút với đúng 2 lần nhập liệu (mục tiêu + thu nhập).

**F2 — Dashboard ngày 0**

FR7: Ngay sau Tada, dashboard hiển thị đầy đủ: mục tiêu + tiến độ 0%, budget tháng, số "còn lại hôm nay" — không có vùng trống trắng.
FR8: Một CTA duy nhất nổi bật: "Ghi khoản chi đầu tiên" (gợi ý mẫu: ly cà phê sáng), luồng ghi hoàn thành trong ~30 giây.
FR9: Sau giao dịch đầu tiên, app hiển thị lời hứa quay lại: "Ngày mai mở app, bạn sẽ biết hôm nay mình tiêu thế nào so với kế hoạch."

**F3 — Daily Insight (narrative layer)**

FR10: Mỗi ngày, dashboard mở đầu bằng đúng **một câu** insight bằng số thật, giọng người thật: số còn được tiêu hôm nay + liên kết với mục tiêu.
FR11: Insight ngày hôm sau phản hồi hành vi hôm trước: dưới kế hoạch → ghi nhận + ảnh hưởng tích cực lên mục tiêu; vượt kế hoạch → thông cảm + điều chỉnh con số hôm nay, không đổ lỗi.
FR12: Insight tính từ dữ liệu thật: `còn lại hôm nay = (tổng budget linh hoạt tháng − đã chi trong tháng) / số ngày còn lại` `[ASSUMPTION: công thức v1 — chốt khi architecture]`.
FR13: Phase gia đình: insight chỉ in-app. Push notification ngoài phạm vi.

**F4 — Goal Progress (thực tế vs kỳ vọng)**

FR14: Mục tiêu hiển thị 2 đường tiến độ: thực tế (balance/target) và kỳ vọng (tuyến tính theo thời gian từ ngày tạo đến deadline).
FR15: Chênh lệch 2 đường sinh narrative: đi trước → "về đích sớm N tháng 🎉"; tụt lại → "góp thêm X là bắt kịp" — hiển thị tại card mục tiêu và len vào daily insight khi đáng nói.
FR16: Mốc tiến độ (10%, 25%, 50%, 75%, 100%) tạo khoảnh khắc chúc mừng cho **mọi** thành viên household.
FR17: Thêm/sửa/xoá mục tiêu sau onboarding thực hiện trong app, không giới hạn số lượng `[ASSUMPTION: UI quản lý goals dùng lại trang Funds hiện có]`.

**F5 — Mời người đồng hành (hậu-onboarding)**

FR18: Household khởi tạo mặc định 1 thành viên. Khái niệm "Cá nhân/Gia đình" không bao giờ là câu hỏi — trạng thái tự suy từ số thành viên.
FR19: Lời mời xuất hiện tại khoảnh khắc có nghĩa: sau 7 ngày sử dụng liên tục `[ASSUMPTION: "dùng đều" = mở app hoặc ghi giao dịch ≥5/7 ngày]`, hoặc user chủ động từ Settings bất cứ lúc nào.
FR20: Người thứ hai vào: thấy cùng mục tiêu, cùng budget; thu nhập household có thể tách theo người góp nếu muốn — không bắt buộc.

**F6 — Reset dữ liệu test**

FR21: Clear toàn bộ households/funds/transactions test hiện có và khởi tạo lại theo cấu trúc mới bằng seed script. Không cần UI migration, không backward compatibility `[ASSUMPTION: thực hiện một lần bởi dev, không phải tính năng user-facing]`.

### NonFunctional Requirements

**Nhóm B — PRD Onboarding v2:**

NFR1: i18n — mọi chuỗi (kể cả insight templates, demo data nhà Minnie) qua `t()`, đủ vi + en; vi default.
NFR2: Tone — thân mật, xưng "bạn", đồng hành không phán xét; tuyệt đối không giọng ngân hàng/kế toán. Copy insight là sản phẩm, không phải string kỹ thuật.
NFR3: Mobile-first — 375px primary, touch target 44px, onboarding thao tác hoàn toàn bằng một tay.
NFR4: Hiệu năng cảm nhận — màn Tada dựng bức tranh với hiệu ứng "đang chuẩn bị cho bạn..." — chờ có chủ đích, không spinner chết.
NFR5: Demo an toàn — dữ liệu nhà Minnie không bao giờ chạm database; không thể lẫn vào báo cáo thật (rủi ro #1 — phải test riêng).
NFR6: Theme — light/dark đầy đủ theo design tokens hiện hành.

**Nhóm A — PRD v1 (invariants còn hiệu lực, áp cho mọi code mới):**

V1-NFR1: 375px primary breakpoint (1 cột)
V1-NFR2: Touch targets min 44×44px
V1-NFR3: Input font-size 16px (tránh iOS zoom)
V1-NFR4: Pages có bottom nav: padding-bottom 64px
V1-NFR5: Skeleton loading cho lists/charts — không spinner toàn trang
V1-NFR6: Lazy load ApexCharts khi tab active
V1-NFR7: TanStack Query stale-time phù hợp per query
V1-NFR8: WCAG AA contrast 4.5:1 (text thường) · 3:1 (large text)
V1-NFR9: `aria-label` cho icon-only buttons
V1-NFR10: Keyboard navigation đầy đủ
V1-NFR11: Mọi strings qua `t()` — không hard-code vi/en
V1-NFR12: Số tiền format theo currency household (phase này VND only)
V1-NFR13: Ngày `DD/MM/YYYY` (vi) · `MM/DD/YYYY` (en)
V1-NFR14: Mọi API route gọi `withAuth()` đầu tiên
V1-NFR15: RLS enforced tại DB level (user client cho user ops)
V1-NFR16: Response shape chuẩn `{ data, error }` mọi API route

### Additional Requirements

Từ Architecture Spine + Addendum kỹ thuật:

- AR1: Không có starter template — codebase hiện hữu; onboarding v2 **thay thế** `src/app/setup/SetupClient.tsx` (wizard 7 bước) + `/api/onboarding/complete`. Component step Income cũ có thể giữ làm nền cho màn Thu nhập mới.
- AR2: Onboarding creation (household + membership) = **system operation** → `supabaseAdmin` (AD-2). Goal fund tạo qua **atomic RPC** hiện hành (A-1 — non-negotiable).
- AR3: Middleware gates (AD-4) giữ nguyên: no session → `/login`; session + `!onboarding_completed` → `/setup`; onboarded + `/setup` → `/dashboard`. Onboarding v2 phải set `onboarding_completed` đúng thời điểm (sau Tada).
- AR4: Mọi API route mới: `withAuth()` first (AD-1) + membership double guard khi nhận householdId (AD-6) + Node.js runtime khi dùng supabaseAdmin (AD-5).
- AR5: Insight layer = **một tầng tổng hợp duy nhất** biến số liệu thành câu nói — không rải logic narrative vào từng component UI. Insight là template có tham số, chọn theo trạng thái — không sinh tự do (kiểm soát tone + i18n).
- AR6: Đường kỳ vọng goal: tuyến tính `target × (ngày đã qua / tổng ngày)`; so với balance thực → chọn template narrative (trước/đúng/sau kỳ vọng).
- AR7: "Budget linh hoạt" = các nhóm chi tiêu biến đổi, loại trừ cố định (thuê nhà, học phí...) và khoản góp mục tiêu.
- AR8: Goal onboarding → fund type `goal` có sẵn trong schema (5 fund types); Quỹ khẩn cấp map vào type `emergency`. Seed 38 categories / 18 budget lines đã có — màn Tada gọi seed này, scale theo income.
- AR9: Household income lưu ở mức household, không gắn user_id người nhập — cho phép tách người góp sau khi có thành viên thứ hai.
- AR10: Reset test data (FR21) = dev script chạy một lần; seed lại theo cấu trúc mới.
- AR11: Open question OQ2 (chốt lúc architecture/story design): Quỹ khẩn cấp mặc định "3 tháng chi tiêu" tính từ **budget** hay thu nhập — nghiêng về budget.
- AR12: State mới household-scoped trong Zustand phải clear khi switch household hoặc derive từ cache key chứa householdId (AD-3).
- AR13: Query keys mới (insight, goals...) qua `keys.*` factory (A-4).

### UX Design Requirements

Không có UX design contract riêng (bmad-ux) — extract từ PRD/addendum + `docs/06_STYLE_GUIDE.md` (visual authority) + `docs/05_UX_SPEC.md`:

UX-DR1: Demo "nhà Minnie" render bằng **đúng components dashboard thật** từ JSON tĩnh trong bundle client (demo = ảnh thật sản phẩm); cần bản vi + en toàn bộ demo data (tên, ghi chú giao dịch); banner ranh giới demo/thật thường trực "Đây là nhà Minnie. Giờ đến lượt nhà bạn →".
UX-DR2: Onboarding 4 màn theo style guide hiện hành: cards 13px/18px radius, buttons pill 44px, inputs 44px radius 18px, semantic tokens (bg-background/bg-card), shadow-card blue-tinted — mobile-first 375px, thao tác một tay.
UX-DR3: Màn Mục tiêu: goal picker dạng danh sách gợi ý (emoji + tên + số mặc định), số mặc định edit inline tại chỗ; lựa chọn "Tự nhập" mở form tên + số đích + thời hạn.
UX-DR4: Màn Tada: sequence "đang chuẩn bị cho bạn..." có chủ đích — dựng dần từng phần bức tranh (budget → goal → kết luận khả thi → số còn lại hôm nay), không spinner chết, tôn trọng `prefers-reduced-motion`.
UX-DR5: Daily insight component: đúng một câu mở đầu dashboard, template i18n có tham số, tone "bạn"; các trạng thái: ngày đầu, dưới kế hoạch, vượt kế hoạch, goal đáng nói.
UX-DR6: Goal progress card: 2 đường tiến độ (thực tế vs kỳ vọng) + narrative chênh lệch; hiển thị tại card mục tiêu (trang Funds + dashboard).
UX-DR7: Milestone celebration UI (10/25/50/75/100%): khoảnh khắc chúc mừng in-app cho mọi thành viên household.
UX-DR8: Day-0 dashboard: một CTA duy nhất nổi bật "Ghi khoản chi đầu tiên" với gợi ý mẫu; luồng ghi ≤30 giây; sau giao dịch đầu hiển thị lời hứa quay lại.
UX-DR9: Invite prompt: xuất hiện tại khoảnh khắc có nghĩa (sau 7 ngày dùng đều) dạng gợi ý không chặn; entry chủ động trong Settings luôn có.
UX-DR10: Toàn bộ UI mới: light/dark đầy đủ, amounts `font-mono tabular-nums` + formatVND, skeleton loading, i18n vi/en qua `t()`.

### FR Coverage Map

FR1: Epic 4 — Màn Hook dashboard demo "nhà Minnie"
FR2: Epic 4 — Màn Mục tiêu (goal picker, 1 goal bắt buộc)
FR3: Epic 4 — Màn Thu nhập (household income)
FR4: Epic 4 — Màn Tada (tự tạo household/account/budget/goal fund + khả thi)
FR5: Epic 4 — Loại bỏ 5 bước wizard cũ
FR6: Epic 4 — Onboarding < 3 phút, 2 lần nhập liệu
FR7: Epic 5 — Dashboard ngày 0 đầy đủ, không vùng trống
FR8: Epic 5 — CTA duy nhất "Ghi khoản chi đầu tiên" ≤30s
FR9: Epic 5 — Lời hứa quay lại sau giao dịch đầu
FR10: Epic 5 — Daily insight 1 câu/ngày từ số thật
FR11: Epic 5 — Insight phản hồi hành vi hôm trước
FR12: Epic 5 — Công thức insight v1 (budget linh hoạt / ngày còn lại)
FR13: Epic 5 — Insight in-app only (phase gia đình)
FR14: Epic 6 — Goal 2 đường tiến độ (thực tế vs kỳ vọng)
FR15: Epic 6 — Narrative chênh lệch (về đích sớm / góp thêm X)
FR16: Epic 6 — Milestone celebration 10/25/50/75/100%
FR17: Epic 6 — CRUD goals trong app (dùng lại trang Funds)
FR18: Epic 4 — Household khởi tạo 1 thành viên, không hỏi "Loại hộ"
FR19: Epic 7 — Invite prompt tại khoảnh khắc có nghĩa + Settings
FR20: Epic 7 — Người thứ hai thấy cùng mục tiêu/budget; income tách người góp optional
FR21: Epic 4 — Reset test data bằng seed script (enabler, story đầu tiên)

V1-FR1–14: Đã delivered qua Epics 1-3 trong `epics.md` cũ — không tạo story mới.

## Epic List

### Epic 4: Onboarding "mở quà" — người mới nhận bức tranh tài chính trong 3 phút

User mới đi qua Hook (demo nhà Minnie) → chọn 1 mục tiêu → nhập thu nhập → nhận Tada: household + tài khoản mặc định + budget scale theo thu nhập + goal fund thật + kết luận khả thi + số "còn lại hôm nay". Wizard 7 bước cũ bị thay thế hoàn toàn. Reset test data dọn đất trước khi build.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR18, FR21

### Epic 5: Ngày 0 & Daily Insight — lý do quay lại mỗi ngày

Sau Tada, dashboard đầy đủ không vùng trống, một CTA ghi khoản chi đầu tiên ≤30 giây, lời hứa ngày mai. Insight layer (một tầng tổng hợp duy nhất — AR5) sinh đúng một câu mỗi ngày từ số thật, phản hồi hành vi hôm trước.
**FRs covered:** FR7, FR8, FR9, FR10, FR11, FR12, FR13

### Epic 6: Goal Progress — mục tiêu thành xương sống narrative

Goal card 2 đường tiến độ (thực tế vs kỳ vọng), narrative chênh lệch len vào daily insight khi đáng nói, milestone celebration cho mọi thành viên, CRUD goals trong app (dùng lại trang Funds). Build trên insight layer Epic 5 nhưng standalone.
**FRs covered:** FR14, FR15, FR16, FR17

### Epic 7: Người đồng hành — từ cá nhân thành gia đình

Invite prompt xuất hiện tại khoảnh khắc có nghĩa (sau 7 ngày dùng đều) hoặc chủ động từ Settings; người thứ hai vào thấy cùng mục tiêu, cùng budget; thu nhập household tách theo người góp nếu muốn. Household tự chuyển "Gia đình" — không ai phải trả lời "Loại hộ".
**FRs covered:** FR19, FR20

**Dependencies:** Epic 4 → 5 → 6 → 7 tuần tự (mỗi epic standalone, chỉ dùng output các epic trước). Epic 7 core (invite) chỉ cần Epic 4; story 7.3 chạm insight/milestone nên xếp sau Epic 5-6. (Epic 1-3 = PRD v1, đã done trong `epics.md` cũ.)

---

## Epic 4: Onboarding "mở quà" — người mới nhận bức tranh tài chính trong 3 phút

**Goal:** User mới đi qua Hook (demo nhà Minnie) → chọn 1 mục tiêu → nhập thu nhập → nhận Tada: household + tài khoản mặc định + budget scale theo thu nhập + goal fund thật + kết luận khả thi + số "còn lại hôm nay". Wizard 7 bước cũ bị thay thế hoàn toàn.

**FRs:** FR1, FR2, FR3, FR4, FR5, FR6, FR18, FR21 | **NFRs:** NFR1-6, V1-NFR1-16

### Story 4.1: Reset dữ liệu test & seed cấu trúc mới

As a developer (dogfooder),
I want một script reset xoá sạch dữ liệu test cũ và seed lại cấu trúc mới,
So that onboarding v2 được build và dogfood trên nền dữ liệu sạch, không vướng cấu trúc cũ.

**Acceptance Criteria:**

**Given** database có households/funds/transactions/budget/accounts test từ cấu trúc cũ
**When** dev chạy seed script reset (một lần, có confirm prompt trước khi xoá)
**Then** toàn bộ dữ liệu household-scoped bị xoá (households, household_members, accounts, funds, transactions, budget, income, invites)
**And** auth users giữ nguyên nhưng `onboarding_completed` reset về `false` — user đi qua onboarding v2 từ đầu

**Given** script đã chạy xong
**When** kiểm tra seed templates
**Then** bộ 38 categories / 18 budget lines template (is_system) còn nguyên và sẵn sàng cho màn Tada gọi
**And** script chạy lại lần 2 không lỗi (idempotent)

**Given** đây là dev script `[ASSUMPTION: chạy một lần bởi dev — FR21]`
**When** review deliverable
**Then** không có UI migration, không backward compatibility, script nằm ngoài app bundle (scripts/ hoặc supabase/)

### Story 4.2: Flow skeleton 4 bước & màn Mục tiêu

As a người dùng mới,
I want chọn một mục tiêu tài chính từ danh sách gợi ý có số mặc định thông minh,
So that mục tiêu của tôi trở thành xương sống câu chuyện tài chính mà không phải nghĩ từ con số 0.

**Acceptance Criteria:**

**Given** user chưa hoàn thành onboarding truy cập `/setup`
**When** flow onboarding v2 render
**Then** shell 4 bước mới (Hook → Mục tiêu → Thu nhập → Tada) thay navigation wizard 7 bước cũ, có progress indicator
**And** state các bước lưu client-side (chưa ghi database cho tới màn Tada)
**And** refresh/reload giữa chừng không mất lựa chọn đã nhập (sessionStorage)

**Given** user ở màn Mục tiêu "Bạn muốn gì cho gia đình mình?"
**When** danh sách gợi ý hiển thị
**Then** có đúng 5 lựa chọn: 🛡️ Quỹ khẩn cấp (3 × chi tiêu tháng — hiển thị "tự tính sau khi có thu nhập"), 🎓 Quỹ học cho con (200tr/5 năm), 🏠 Mua nhà (500tr/3 năm), ✈️ Du lịch gia đình (30tr/1 năm), ✏️ Tự nhập (tên + số đích + thời hạn)
**And** số mặc định sửa được ngay tại chỗ (inline edit), amounts hiển thị `font-mono` + formatVND

**Given** user chưa chọn mục tiêu nào
**When** user cố đi tiếp
**Then** không đi được — bước này bắt buộc, không có lối "để sau" (FR2)
**And** chỉ chọn được đúng một mục tiêu

**Given** mobile 375px
**When** thao tác toàn màn hình
**Then** touch targets ≥44px, thao tác một tay được, input font 16px, mọi string qua `t()` vi+en

### Story 4.3: Màn Thu nhập

As a người dùng mới,
I want nhập đúng một con số — thu nhập hàng tháng của gia đình,
So that app có đủ dữ liệu dựng bức tranh tài chính cho tôi mà không phải khai form dài.

**Acceptance Criteria:**

**Given** user đã chọn mục tiêu và sang màn Thu nhập
**When** màn hình render
**Then** có đúng một trường nhập: "Thu nhập hàng tháng của gia đình bạn khoảng bao nhiêu?" — gắn nhãn thu nhập của hộ, không gắn cá nhân người nhập (AR9)
**And** amount input dùng `font-mono`, format VND, font-size 16px

**Given** user nhập giá trị ≤ 0 hoặc bỏ trống
**When** user bấm tiếp tục
**Then** validation chặn với message thân thiện (Zod schema), form giữ nguyên giá trị

**Given** user đã chọn 🛡️ Quỹ khẩn cấp ở màn trước
**When** income hợp lệ được nhập
**Then** target quỹ khẩn cấp tự tính = 3 × tổng budget chi tiêu tháng (scale theo income — chốt OQ2: tính từ budget)
**And** user thấy số target đã tính trước khi sang Tada, sửa được nếu muốn

### Story 4.4: API Tada — khởi tạo bức tranh tài chính

As a người dùng mới hoàn thành 2 bước nhập liệu,
I want app tự dựng toàn bộ cấu trúc tài chính từ mục tiêu + thu nhập,
So that tôi nhận được giá trị thật ngay mà không phải hiểu khái niệm household/account/category/budget nào.

**Acceptance Criteria:**

**Given** request POST `/api/onboarding/complete` với payload `{ goal: { type, name, target, deadline }, monthlyIncome }`
**When** route xử lý
**Then** `withAuth()` là dòng đầu tiên (AD-1), body validate bằng Zod safeParse → 400 nếu fail, response shape `{ data, error }` chuẩn
**And** route chạy Node.js runtime, system ops dùng `supabaseAdmin` (AD-2, AD-5)

**Given** payload hợp lệ
**When** khởi tạo thực thi
**Then** tạo tuần tự: (a) household 1 thành viên — không có trường "loại hộ" (FR18); (b) account mặc định "Tài khoản chính"; (c) 38 categories + 18 budget lines từ seed, số tiền budget **scale theo thu nhập** (không phải hằng số); (d) income record ở mức household không gắn user_id; (e) goal fund thật qua **atomic RPC** (type `goal`, hoặc `emergency` cho quỹ khẩn cấp) — không direct insert (A-1)
**And** `onboarding_completed` set `true` sau khi tất cả thành công

**Given** khởi tạo xong
**When** response trả về
**Then** data chứa: `feasibility` — `monthlyNeeded = (target − 0) / số tháng` so với `available = income − tổng budget`, flag `feasible` + gợi ý điều chỉnh nếu không khả thi; `todayRemaining` — số "hôm nay còn X đ chi tiêu thoải mái" (công thức budget linh hoạt AR7)

**Given** toàn bộ khởi tạo (household, account, categories/budget, income, goal fund)
**When** review implementation
**Then** khởi tạo gói trong **một Postgres function** (ví dụ `complete_onboarding_v2`) — một transaction, all-or-nothing
**And** một bước fail giữa chừng → không entity nào tồn tại (không household nửa vời), response error string rõ ràng

**Given** Zod schema + feasibility calculation
**When** chạy test suite
**Then** unit tests đầy đủ edge cases (income 0/âm, deadline quá khứ, target 0, số tháng lẻ) trong `src/__tests__/validations/`

### Story 4.5: Màn Tada — reveal có chủ đích

As a người dùng mới,
I want thấy bức tranh tài chính của mình được dựng lên từng phần như mở quà,
So that tôi cảm nhận được giá trị nhận lại ngay — không phải chờ spinner vô hồn.

**Acceptance Criteria:**

**Given** user bấm hoàn tất ở màn Thu nhập
**When** API Tada đang chạy
**Then** màn hình hiển thị sequence "đang chuẩn bị cho bạn..." dựng dần từng phần: budget tháng → mục tiêu thành quỹ thật → kết luận khả thi → số "còn lại hôm nay" (NFR4 — chờ có chủ đích, không spinner chết)
**And** `prefers-reduced-motion` → hiển thị tức thì không animation (V1-FR10)

**Given** kết quả khả thi (`feasible = true`)
**When** Tada hiển thị kết luận
**Then** thấy "Cần góp X/tháng — khả thi ✓ với thu nhập của bạn" — amounts `font-mono`, tone xưng "bạn" (NFR2)

**Given** kết quả không khả thi
**When** Tada hiển thị gợi ý
**Then** user thấy 2 lựa chọn điều chỉnh: giảm số đích hoặc kéo dài thời hạn — chỉnh inline, số liệu recompute, fund update theo
**And** không có giọng phán xét/đổ lỗi

**Given** Tada hoàn thành
**When** user bấm CTA cuối
**Then** vào thẳng dashboard — middleware gate cho qua vì `onboarding_completed = true` (AD-4)

### Story 4.6: Màn Hook — demo "nhà Minnie"

As a người dùng mới lần đầu mở app,
I want thấy dashboard sống động của một gia đình mẫu trước khi phải nhập bất cứ gì,
So that tôi hiểu ngay app này mang lại gì cho mình — thành quả trước, khai báo sau.

**Acceptance Criteria:**

**Given** user chưa onboard vào `/setup`
**When** bước đầu tiên render
**Then** dashboard demo "nhà Minnie" hiển thị: mục tiêu "Quỹ học cho bé Na 43%", ngân sách tháng, dòng "Hôm nay nhà Minnie còn 85.000đ chi tiêu thoải mái"
**And** render bằng **đúng components dashboard thật** với data từ JSON tĩnh trong bundle (UX-DR1 — demo = ảnh thật sản phẩm)

**Given** demo dataset
**When** review nội dung JSON
**Then** 2-3 tháng dữ liệu gồm **transactions có ghi chú đời thường** (cà phê sáng, học phí, đi chợ...), budget, goal fund 43% — đủ dựng mọi chart trên dashboard, widget giao dịch gần đây có data (chốt OQ1: 2-3 tháng)
**And** dataset nhất quán nội bộ: số "còn 85.000đ" và mọi chart derive được từ chính transactions/budget trong JSON — không số bịa rời rạc

**Given** demo đang hiển thị
**When** kiểm tra ranh giới demo/thật
**Then** banner thường trực "Đây là nhà Minnie. Giờ đến lượt nhà bạn →" không thể miss
**And** không một network call ghi database nào phát sinh từ màn demo (NFR5 — test riêng verify)

**Given** user ở màn Hook
**When** user hành động
**Then** CTA chính "Đến lượt nhà bạn" → sang màn Mục tiêu; nút "Bỏ qua" → cũng sang màn Mục tiêu (FR1)

**Given** demo data
**When** đổi ngôn ngữ vi/en
**Then** toàn bộ demo (tên, ghi chú giao dịch, insight) có bản dịch đầy đủ qua `t()` (NFR1)

### Story 4.7: Gỡ wizard cũ & verify hành trình 3 phút

As a người dùng mới,
I want một luồng onboarding duy nhất, gọn, không dấu vết wizard cũ,
So that trải nghiệm 4 bước là con đường duy nhất và hoàn thành dưới 3 phút.

**Acceptance Criteria:**

**Given** onboarding v2 hoạt động end-to-end
**When** gỡ wizard cũ
**Then** 5 bước cũ bị xoá khỏi codebase: Loại hộ, Mời thành viên, Tài khoản, Nợ, Categories, Budget (component + logic trong `SetupClient.tsx`); phần Income cũ được tái dùng/refactor cho màn Thu nhập nếu phù hợp (AR1)
**And** translation keys orphan của wizard cũ bị dọn, không dead code
**And** handler cũ của `/api/onboarding/complete` đã bị thay thế hoàn toàn bởi bản v2 (story 4.4) — không code path wizard cũ nào còn được gọi, không route mồ côi

**Given** wizard cũ đã gỡ
**When** kiểm tra routes + middleware
**Then** gates AD-4 vẫn đúng: chưa onboard → `/setup` (flow mới); đã onboard vào `/setup` → redirect `/dashboard`
**And** không đường nào (link, redirect, deep-link) dẫn tới bước wizard cũ

**Given** user mới đăng ký từ đầu
**When** đi trọn hành trình Hook → Mục tiêu → Thu nhập → Tada → dashboard
**Then** hoàn thành dưới 3 phút với đúng 2 lần nhập liệu (FR6 — verify thủ công dogfood)

---

## Epic 5: Ngày 0 & Daily Insight — lý do quay lại mỗi ngày

**Goal:** Sau Tada, dashboard đầy đủ không vùng trống, một CTA ghi khoản chi đầu tiên ≤30 giây, lời hứa ngày mai. Insight layer (một tầng tổng hợp duy nhất) sinh đúng một câu mỗi ngày từ số thật, phản hồi hành vi hôm trước.

**FRs:** FR7, FR8, FR9, FR10, FR11, FR12, FR13 | **NFRs:** NFR1, NFR2, NFR6, V1-NFR1-16

### Story 5.1: Insight engine — tầng tổng hợp & công thức v1

As a developer xây narrative layer,
I want một tầng tổng hợp duy nhất biến số liệu thành câu nói qua template có tham số,
So that tone và i18n được kiểm soát tập trung — không rải logic narrative vào từng component UI.

**Acceptance Criteria:**

**Given** dữ liệu tháng hiện tại (budget lines, transactions, goal funds)
**When** engine tính "còn lại hôm nay"
**Then** công thức v1: `(tổng budget linh hoạt tháng − đã chi trong tháng) / số ngày còn lại trong tháng` (FR12)
**And** "budget linh hoạt" = nhóm chi tiêu biến đổi, loại trừ nhóm cố định (thuê nhà, học phí...) và khoản góp mục tiêu (AR7)

**Given** engine là tầng tổng hợp duy nhất (AR5)
**When** review kiến trúc module
**Then** engine là pure functions trong `src/lib/` (input số liệu → output insight descriptor), không import component UI, không fetch
**And** insight = template có tham số chọn theo trạng thái — không sinh chuỗi tự do; mọi template qua `t()` đủ vi + en (NFR1)

**Given** các trạng thái insight: ngày đầu tiên, dưới kế hoạch hôm qua, vượt kế hoạch hôm qua, chưa có giao dịch
**When** engine chọn template
**Then** mỗi trạng thái map đúng một template, tham số điền số thật (số còn lại, chênh lệch hôm qua, tên goal, số góp tháng)
**And** tone template: xưng "bạn", đồng hành, không giọng ngân hàng/kế toán (NFR2 — copy là sản phẩm)

**Given** edge cases: ngày cuối tháng, budget linh hoạt = 0, đã chi vượt toàn bộ budget, tháng mới chưa có giao dịch, timezone GMT+7 (`toYearMonth()` local time)
**When** chạy test suite
**Then** unit tests đầy đủ trong `src/__tests__/`, số ngày còn lại tính theo local time không lệch UTC

### Story 5.2: Dashboard ngày 0 — không vùng trống

As a người dùng mới vừa xong Tada,
I want dashboard hiển thị đầy đủ bức tranh của tôi ngay từ giây đầu,
So that tôi không rơi vào màn hình trống trơn và biết app đang đồng hành với mình.

**Acceptance Criteria:**

**Given** user vừa hoàn thành onboarding vào dashboard lần đầu
**When** dashboard render
**Then** hiển thị đủ: card mục tiêu + tiến độ 0%, budget tháng đã chia nhóm, số "còn lại hôm nay" từ insight engine — không vùng trống trắng (FR7)
**And** skeleton loading trong lúc fetch (V1-NFR5), không spinner toàn trang

**Given** household chưa có giao dịch nào
**When** các widget thống kê render
**Then** không widget nào hiển thị empty-state lạnh lùng kiểu "Chưa có dữ liệu" — thay bằng trạng thái ngày 0 có định hướng (số 0 + copy đồng hành)

**Given** mobile 375px + dark mode
**When** dashboard ngày 0 render
**Then** layout 1 cột đúng chuẩn, tokens light/dark đầy đủ (NFR6), amounts `font-mono tabular-nums` + formatVND

### Story 5.3: CTA khoản chi đầu tiên & lời hứa quay lại

As a người dùng mới trên dashboard ngày 0,
I want một lời mời hành động duy nhất — ghi khoản chi đầu tiên trong 30 giây,
So that tôi khởi động vòng lặp ghi chép ngay hôm nay và có lý do mở app ngày mai.

**Acceptance Criteria:**

**Given** dashboard ngày 0 (chưa có giao dịch nào)
**When** user nhìn màn hình
**Then** đúng một CTA nổi bật duy nhất: "Ghi khoản chi đầu tiên — thử ly cà phê sáng nay?" (FR8) — không CTA cạnh tranh nào khác
**And** CTA mở luồng ghi giao dịch rút gọn: amount + category gợi ý sẵn + lưu — hoàn thành được trong ~30 giây, một tay trên mobile

**Given** user lưu giao dịch đầu tiên thành công
**When** app phản hồi
**Then** hiển thị lời hứa quay lại: "Ngày mai mở app, bạn sẽ biết hôm nay mình tiêu thế nào so với kế hoạch." (FR9)
**And** toast success 2s, giao dịch xuất hiện ngay (query invalidate qua `keys.*`)

**Given** household đã có ≥1 giao dịch
**When** dashboard render lại
**Then** CTA ngày 0 không hiển thị nữa — vị trí mở đầu dashboard nhường cho daily insight

### Story 5.4: Daily insight — câu mở đầu dashboard

As a người dùng quay lại app mỗi ngày,
I want dashboard chào tôi bằng đúng một câu bằng số thật giọng người thật,
So that tôi thấy app là người đồng hành chứ không phải bảng kế toán.

**Acceptance Criteria:**

**Given** user mở dashboard bất kỳ ngày nào sau ngày 0
**When** dashboard render
**Then** vị trí mở đầu là đúng **một câu** insight từ engine 5.1: số còn được tiêu hôm nay + liên kết mục tiêu — "còn 118k *vì* 3,3tr tháng này đã để dành cho Quỹ học" (FR10)
**And** insight chỉ in-app, không push notification (FR13)

**Given** insight component
**When** review implementation
**Then** component chỉ render descriptor từ engine — không tự tính toán, không hardcode câu (AR5)
**And** template i18n vi/en, amounts `font-mono`, đổi ngôn ngữ đổi trọn câu

**Given** dữ liệu chưa sẵn sàng (đang fetch)
**When** insight chờ
**Then** skeleton một dòng — không nhảy layout khi câu xuất hiện

### Story 5.5: Insight phản hồi hành vi hôm trước

As a người dùng đã ghi chép hôm qua,
I want câu chào hôm nay phản hồi việc tôi tiêu thế nào so với kế hoạch,
So that tôi hiểu vòng lặp ghi chép → thấy mình → mục tiêu nhích lên, và không bị phán xét khi lỡ vượt.

**Acceptance Criteria:**

**Given** hôm qua user tiêu dưới kế hoạch ngày
**When** insight hôm nay render
**Then** ghi nhận + ảnh hưởng tích cực lên mục tiêu: "Hôm qua bạn tiêu 35.000đ — dưới kế hoạch 85.000đ. Khoản dư đẩy Quỹ học nhanh thêm một chút 🎉. Hôm nay bạn còn 118.000đ." (FR11, khớp UJ-2)
**And** `[ASSUMPTION: "kế hoạch hôm qua" recompute từ dữ liệu hiện tại — chấp nhận lệch nếu budget bị sửa giữa tháng; v1 không lưu snapshot kế hoạch theo ngày]`

**Given** hôm qua user tiêu vượt kế hoạch ngày
**When** insight hôm nay render
**Then** giọng thông cảm + điều chỉnh con số hôm nay — tuyệt đối không đổ lỗi, không cảnh báo đỏ gắt (NFR2)
**And** con số "còn lại hôm nay" đã recompute theo công thức v1 (tự hấp thụ phần vượt)

**Given** hôm qua user không ghi giao dịch nào
**When** insight hôm nay render
**Then** template trạng thái riêng — nhắc nhẹ nhàng kèm số còn lại, không trách móc

**Given** các nhánh trạng thái (dưới/vượt/không ghi/ngày đầu)
**When** chạy test suite engine
**Then** unit tests cover đủ 4 nhánh chọn template + tham số đúng

---

## Epic 6: Goal Progress — mục tiêu thành xương sống narrative

**Goal:** Goal card 2 đường tiến độ (thực tế vs kỳ vọng), narrative chênh lệch len vào daily insight khi đáng nói, milestone celebration cho mọi thành viên, CRUD goals trong app. Build trên insight layer Epic 5 nhưng standalone.

**FRs:** FR14, FR15, FR16, FR17 | **NFRs:** NFR1, NFR2, NFR6, V1-NFR1-16

### Story 6.1: Engine mở rộng — đường kỳ vọng & narrative chênh lệch

As a developer mở rộng narrative layer,
I want engine tính đường tiến độ kỳ vọng và chọn narrative theo chênh lệch,
So that mọi nơi hiển thị goal (card, insight) dùng chung một nguồn số + câu, không tính lặp.

**Acceptance Criteria:**

**Given** goal fund có target, ngày tạo, deadline, balance hiện tại
**When** engine tính tiến độ
**Then** đường kỳ vọng tuyến tính = `target × (ngày đã qua / tổng ngày)` (AR6); đường thực tế = `balance / target`
**And** tính theo local time GMT+7, đơn vị ngày

**Given** chênh lệch thực tế vs kỳ vọng
**When** engine chọn narrative
**Then** đi trước → "về đích sớm N tháng 🎉" (N từ tốc độ góp thực tế); tụt lại → "góp thêm X là bắt kịp" (X = số thiếu so với kỳ vọng); đúng nhịp → template ghi nhận đều đặn (FR15)
**And** template có tham số qua `t()` vi+en, tone "bạn" (NFR2)

**Given** rule "khi đáng nói" cho daily insight
**When** engine quyết định goal narrative có len vào câu chào hàng ngày không
**Then** rule rõ ràng, testable: chênh lệch vượt ngưỡng (ví dụ ≥1 tháng tiến độ) hoặc vừa qua milestone — không lặp lại liên tiếp nhiều ngày cùng một câu
**And** ngưỡng là constant có tên, đổi được một chỗ

**Given** edge cases: goal vừa tạo hôm nay (0 ngày), deadline đã qua, balance vượt target, tổng ngày = 0
**When** chạy test suite
**Then** unit tests đầy đủ, không chia cho 0, không narrative vô nghĩa

### Story 6.2: Goal progress card — 2 đường tiến độ

As a người dùng có mục tiêu,
I want thấy mục tiêu của mình đang đi trước hay tụt lại so với kế hoạch ngay trên card,
So that tôi biết mình đứng đâu mà không phải tự tính toán.

**Acceptance Criteria:**

**Given** goal fund hiển thị tại trang Funds và dashboard
**When** card render
**Then** 2 đường tiến độ hiển thị rõ: thực tế (balance/target) và kỳ vọng (từ engine 6.1) — phân biệt bằng màu/label, không cần đọc chú thích mới hiểu (FR14)
**And** amounts `font-mono` + formatVND, card đúng style guide (13px/18px radius, shadow-card), light/dark đầy đủ (NFR6)

**Given** chênh lệch đáng kể giữa 2 đường
**When** card render
**Then** narrative từ engine hiển thị tại card: "về đích sớm N tháng 🎉" hoặc "góp thêm X là bắt kịp" (FR15)
**And** component chỉ render descriptor — không tự tính (AR5)

**Given** goal narrative "đáng nói" theo rule 3.1
**When** daily insight render (component Epic 5)
**Then** câu goal len vào insight thay/kèm câu mặc định — vẫn giữ nguyên tắc đúng một câu mở đầu

**Given** mobile 375px
**When** card render trong list funds
**Then** 2 đường + narrative không vỡ layout 1 cột, touch target ≥44px

### Story 6.3: Milestone celebration

As a thành viên household có mục tiêu chung,
I want khoảnh khắc chúc mừng khi mục tiêu đạt mốc,
So that cả nhà cùng cảm nhận tiến bộ — tiền để dành có câu chuyện, không chỉ là con số.

**Acceptance Criteria:**

**Given** goal fund vượt mốc 10%, 25%, 50%, 75% hoặc 100% sau một lần góp
**When** thành viên household mở app (bất kỳ ai — một hoặc nhiều người)
**Then** khoảnh khắc chúc mừng in-app hiển thị: mốc đạt được + tên goal + câu chúc theo tone đồng hành (FR16)
**And** mỗi mốc chúc mừng đúng một lần per thành viên — không lặp mỗi lần mở app

**Given** trạng thái "đã thấy milestone" cần lưu per user
**When** review implementation
**Then** tracking không vi phạm AD-3: household-scoped state clear khi switch household hoặc key theo householdId

**Given** một lần góp lớn nhảy qua nhiều mốc (ví dụ 5% → 60%)
**When** celebration hiển thị
**Then** chúc mừng mốc cao nhất đạt được, không xếp hàng nhiều popup liên tiếp

**Given** `prefers-reduced-motion`
**When** celebration render
**Then** hiệu ứng tôn trọng setting (V1-FR10), vẫn hiển thị nội dung chúc mừng tĩnh

### Story 6.4: CRUD goals trong app

As a người dùng sau onboarding,
I want thêm/sửa/xoá mục tiêu ngay trong app không giới hạn số lượng,
So that cuộc sống thay đổi thì mục tiêu đổi theo — không bị khoá vào lựa chọn lúc onboarding.

**Acceptance Criteria:**

**Given** trang Funds hiện có (fund type `goal`/`emergency` đã CRUD được)
**When** user tạo goal mới
**Then** form có đủ: tên, số đích, **thời hạn (deadline)** — field mới cho expected line; danh sách gợi ý + số mặc định như onboarding tái dùng được (FR17, `[ASSUMPTION: UI dùng lại trang Funds]`)
**And** tạo qua atomic RPC như mọi fund (A-1), không giới hạn số lượng goal

**Given** user sửa target hoặc deadline goal đang chạy
**When** lưu thành công
**Then** đường kỳ vọng + narrative recompute theo số mới ngay (engine 6.1 nhận input mới), cache invalidate qua `keys.*`

**Given** user xoá goal
**When** thao tác xoá
**Then** ConfirmDialog trước mutation (destructive), balance còn lại xử lý theo luồng release fund hiện hành
**And** goal bị xoá biến khỏi dashboard + insight — không narrative mồ côi

**Given** goal do onboarding tạo (story 4.4)
**When** user xem tại trang Funds
**Then** không khác biệt gì goal tạo trong app — cùng entity, cùng card, cùng narrative

---

## Epic 7: Người đồng hành — từ cá nhân thành gia đình

**Goal:** Invite prompt xuất hiện tại khoảnh khắc có nghĩa (sau 7 ngày dùng đều) hoặc chủ động từ Settings; người thứ hai vào thấy cùng mục tiêu, cùng budget; thu nhập household tách theo người góp nếu muốn. Household tự chuyển "Gia đình" — không ai phải trả lời "Loại hộ".

**FRs:** FR19, FR20 | **NFRs:** NFR1, NFR2, V1-NFR1-16

### Story 7.1: Invite từ Settings & trạng thái household tự suy

As a người dùng muốn mời vợ/chồng,
I want mời người đồng hành từ Settings bất cứ lúc nào,
So that flow mời luôn sẵn — không phụ thuộc prompt, không cần wizard cũ.

**Acceptance Criteria:**

**Given** wizard cũ (bước Mời thành viên) đã bị gỡ ở Epic 4
**When** user vào Settings
**Then** entry "Mời người đồng hành" hiển thị — flow mời (tạo invite token qua system op, AD-2) hoạt động độc lập khỏi onboarding (FR19)
**And** route API mời: `withAuth()` first + membership double guard (AD-6)

**Given** household đang 1 thành viên
**When** UI hiển thị trạng thái household
**Then** không nơi nào bắt user khai "Cá nhân/Gia đình" — trạng thái tự suy từ số thành viên (FR18): 1 người → không nhãn/nhãn trung tính, ≥2 người → "Gia đình"

**Given** invite được tạo
**When** user chia sẻ
**Then** link/mã mời copy được, có hạn dùng, toast success 2s
**And** mọi string qua `t()` vi+en, tone "bạn" (NFR2)

### Story 7.2: Khoảnh khắc có nghĩa — prompt mời sau 7 ngày dùng đều

As a người dùng đã dùng app đều tuần đầu,
I want được gợi ý mời người đồng hành đúng lúc tôi đã thấy giá trị,
So that lời mời có sức nặng — không phải spam lúc tôi còn chưa hiểu app.

**Acceptance Criteria:**

**Given** định nghĩa "dùng đều" = mở app hoặc ghi giao dịch ≥5/7 ngày gần nhất `[ASSUMPTION: FR19]`
**When** hệ thống track hoạt động
**Then** tracking tối giản phase gia đình (ví dụ last-active dates per user), đủ để đánh giá điều kiện — không dựng analytics infrastructure (ngoài phạm vi)

**Given** user đạt điều kiện 7 ngày dùng đều và household vẫn 1 thành viên
**When** user mở dashboard
**Then** prompt gợi ý xuất hiện: "Quản lý cùng nhau dễ hơn một mình — mời người đồng hành?" — dạng gợi ý không chặn, dismiss được (FR19)
**And** dismiss rồi không hiện lại liên tục (cooldown hoặc chỉ nhắc lại sau khoảng dài); đường Settings (4.1) vẫn luôn sẵn

**Given** household đã ≥2 thành viên
**When** điều kiện prompt được đánh giá
**Then** prompt không bao giờ xuất hiện nữa

**Given** trạng thái dismiss/seen của prompt
**When** review implementation
**Then** state household-scoped tuân AD-3 (clear khi switch household hoặc key theo householdId)

### Story 7.3: Người thứ hai bước vào

As a vợ/chồng nhận lời mời,
I want vào app thấy ngay cùng mục tiêu và budget của gia đình,
So that chúng tôi nhìn cùng một bức tranh — câu chuyện thành chuyện chung.

**Acceptance Criteria:**

**Given** người thứ hai accept invite thành công
**When** họ vào dashboard lần đầu
**Then** thấy cùng mục tiêu, cùng budget, cùng số "còn lại hôm nay" như người mời — không phải onboarding lại từ đầu (FR20)
**And** middleware gate xử lý đúng: user mới join có household → vào thẳng dashboard, không bị đẩy về `/setup`

**Given** người thứ hai đã vào household
**When** cả hai dùng app
**Then** daily insight + goal narrative + milestone celebration hoạt động cho cả hai (FR16 — mọi thành viên)
**And** trạng thái household hiển thị "Gia đình" (tự suy, story 7.1)

**Given** thu nhập household đang là một con số chung (AR9 — không gắn user_id)
**When** household muốn tách thu nhập theo người góp
**Then** Settings cho phép khai thu nhập theo từng thành viên — hoàn toàn optional, không bắt buộc, tổng vẫn là household income (FR20)
**And** không tách thì mọi tính toán giữ nguyên con số chung

**Given** người thứ hai ghi giao dịch
**When** người thứ nhất mở app
**Then** số liệu đồng bộ (cùng household data), insight tính trên tổng household — không tách "tiền anh tiền em" trong narrative

## Epic 8: Onboarding V2 Redesign — Phương pháp & Multi-Goal

**Mục tiêu:** Onboarding truyền tải phương pháp tài chính có kiểm chứng (Pay Yourself First — Clason; Conscious Spending Plan — Ramit Sethi; mental accounting — Thaler, Nobel Kinh tế 2017), quỹ khẩn cấp trở thành nền tảng bắt buộc thay vì 1-trong-4 lựa chọn, user chọn được NHIỀU mục tiêu cùng lúc, và màn Tada thực sự "tada" — khép vòng lặp với lời hứa ở Hook step.

**Nguồn gốc:** Party-mode session 06-07-2026 — feedback trực tiếp từ DzungDuong khi tự trải nghiệm onboarding với tư duy người dùng mới.

**Phụ thuộc:** Epic 4 (done) — toàn bộ flow V2 hiện có là nền để sửa.

### Story 8.1: Nền multi-goal — schema, RPC, store

As a người dùng mới,
I want quỹ khẩn cấp LUÔN được tạo làm nền tảng và có thể thêm mục tiêu riêng bên cạnh,
So that tôi không phải "hy sinh" quỹ khẩn cấp khi tôi cũng muốn tiết kiệm mua nhà/cho con học.

**Acceptance Criteria:**

**Given** user hoàn tất onboarding với 0 mục tiêu thêm
**When** RPC `complete_onboarding_v2` chạy
**Then** vẫn tạo đúng 1 fund `emergency` với target tự tính (3 × chi tiêu tháng theo budget)

**Given** user chọn thêm N mục tiêu (vd Mua nhà + Du lịch)
**When** RPC chạy
**Then** tạo 1 fund emergency + N fund `goal` trong CÙNG transaction — all-or-nothing

**Given** session cũ còn state shape cũ (goal đơn) trong sessionStorage
**When** user quay lại flow
**Then** store migrate an toàn, không crash (zustand persist version + migrate)

**Given** API response trả về mảng funds
**When** TadaStep render
**Then** stage goal hiển thị đủ danh sách fund đã tạo, TadaFinishButton cập nhật đúng fund khi user điều chỉnh

### Story 8.2: Goal step 2 tầng — nền khẩn cấp + multi-select mục tiêu

As a người dùng mới chưa hiểu tài chính,
I want thấy rõ quỹ khẩn cấp là lớp bảo vệ mặc định và tự chọn thêm mục tiêu phù hợp hoàn cảnh của TÔI,
So that tôi không bị ép vào preset không liên quan (chưa có con, đã có nhà).

**Acceptance Criteria:**

**Given** user vào Goal step
**When** màn hình render
**Then** tầng 1 hiển thị card Quỹ khẩn cấp cố định (không bỏ chọn được) với blurb ~108 ký tự giải thích what/why/when + badge "✓ Nền tảng đã xây"

**Given** tầng 2 hiển thị các mục tiêu
**When** user bấm chọn/bỏ chọn
**Then** hoạt động như multi-select (checkbox semantics), card sáng viền primary khi chọn, counter "Đã chọn N quỹ", luôn có lựa chọn "Mục tiêu khác" (tự nhập) và "Chưa cần, để sau"

**Given** user chọn 1+ mục tiêu có editor
**When** giá trị target/months thiếu hoặc ≤ 0
**Then** nút Tiếp tục disable cho tới khi mọi mục tiêu đã chọn hợp lệ

### Story 8.3: Tada redesign — visual + khép vòng lặp Hook

As a người dùng vừa hoàn tất setup,
I want hiểu ngay hệ thống vừa dựng gì cho tôi và cảm nhận được khoảnh khắc "tada" thật,
So that tôi tin tưởng bức tranh tài chính và biết con số hôm nay của mình.

**Acceptance Criteria:**

**Given** stage `budget` reveal
**When** render
**Then** hiển thị thanh tỷ lệ trực quan theo nhóm Conscious Spending Plan (Cố định / Đầu tư & tiết kiệm / Linh hoạt / Trả nợ) với % + số tiền `font-mono`, không phải đoạn văn thuần

**Given** stage `goal` reveal
**When** render
**Then** hiển thị danh sách thẻ fund (emergency + các goal đã chọn) với đúng Duotone icon khớp GoalStep — icon dùng chung 1 nguồn, không duplicate

**Given** stage `feasibility` reveal
**When** render
**Then** headline plain-language + 1 dòng rationale ngắn (mental accounting — Thaler, Nobel 2017)

**Given** stage `todayRemaining` reveal (stage cuối)
**When** render
**Then** số "hôm nay còn lại" hiển thị to (text-3xl+, font-mono, tabular-nums) với scale-in nhẹ (tôn trọng `prefers-reduced-motion`) + câu khép vòng lặp: "Lúc nãy là ví dụ. Đây mới là con số của riêng bạn."

### Story 8.4: Hook mindset + method framing + docs

As a người dùng mới,
I want biết app dựa trên phương pháp đã kiểm chứng ngay từ màn đầu,
So that tôi tin đây là khoa học chứ không phải tự suy diễn.

**Acceptance Criteria:**

**Given** user vào Hook step
**When** màn hình render
**Then** có dòng mindset "Trả cho bản thân trước" ghi nguồn "Người giàu có nhất thành Babylon" (Clason) — i18n vi/en đầy đủ

**Given** app tự giới thiệu phương pháp
**When** copy nhắc đến framework
**Then** CHỈ dùng 3 nguồn đã xác thực: Pay Yourself First (Clason), Conscious Spending Plan (Ramit Sethi), mental accounting (Thaler) — KHÔNG nhắc 6 Chiếc Lọ hay 50/30/20

**Given** docs dự án
**When** story hoàn tất
**Then** `docs/05_UX_SPEC.md` (flow onboarding mới) và `docs/02_BUSINESS_RULES.md` (emergency bắt buộc, multi-goal) được cập nhật khớp hiện trạng

## Epic 9: Minh bạch số liệu Tada + kiểm soát quỹ hậu onboarding

**Mục tiêu:** User hiểu đúng mọi con số ở màn Tada (góp bao nhiêu/tháng cho từng quỹ, tổng góp toàn bộ, vì sao được chi tiêu thoải mái X/ngày), quỹ giữ đúng bản sắc (icon) từ onboarding vào app, và điều chỉnh được quỹ bất cứ lúc nào sau onboarding.

**Nguồn:** Change request 09-07-2026 (5 items user feedback sau Epic 8 done). Map PRD: FR4 (Tada feasibility), FR2 (goal setup), FR17 (sửa goals hậu onboarding — gap của Story 6.4).

**FRs:**

- **FR-9.1** — Khi user chỉnh số tháng ở Tada, số tiền góp/tháng hiển thị theo TỪNG QUỸ đang chỉnh (target/months, vd 400tr/10 = 40tr/tháng). Root cause hiện tại: `TadaStep.tsx:134-145` show tổng household (`otherFundsMonthly + target/months`) dưới label per-fund "Cần góp {{amount}}/tháng". Feasibility check tổng vẫn giữ nguyên logic.
- **FR-9.2** — Card "Hôm nay bạn có thể chi tiêu thoải mái" có mô tả ngắn cách tính: 20% thu nhập (nhóm chi linh hoạt) ÷ số ngày trong tháng (`calculateTodayRemaining`, budgetTemplate.ts:77-81). i18n vi/en.
- **FR-9.3** — Danh sách mục tiêu ở Tada: hiện số góp/tháng cho TỪNG quỹ + dòng TỔNG góp toàn bộ các quỹ.
- **FR-9.4** — Quỹ custom ở GoalStep: user chọn được icon (phong cách Phosphor duotone, có fallback). Khi hoàn thành onboarding, icon lưu vào `funds.icon` cho MỌI quỹ (preset + custom) — RPC `complete_onboarding_v2` nhận icon trong `p_goals` (migration mới).
- **FR-9.5** — Sau onboarding, user điều chỉnh được quỹ mọi lúc: `GoalEditSheet` thêm icon + target months; emergency fund có edit UI (target months expense); `updateFundSchema` bổ sung `target_months_expense`.

### Story 9.1: Tada số liệu minh bạch — per-fund, tổng, giải thích

As a người dùng mới vừa setup xong,
I want thấy rõ từng quỹ cần góp bao nhiêu mỗi tháng, tổng cộng bao nhiêu, và hiểu vì sao tôi được chi tiêu thoải mái X mỗi ngày,
So that tôi tin con số app đưa ra thay vì nghi nó tính sai.

**Acceptance Criteria:**

**Given** user ở Tada chỉnh quỹ 400.000.000đ về 10 tháng
**When** UI recalc
**Then** số góp/tháng của QUỸ ĐÓ hiển thị 40.000.000đ (target/months); cảnh báo khả thi (nếu có) dùng tổng household nhưng label phân biệt rõ "tổng tất cả quỹ"

**Given** danh sách mục tiêu render ở Tada
**When** có 1 emergency + N goal funds
**Then** mỗi quỹ hiện số góp/tháng riêng, cuối danh sách có dòng tổng góp toàn bộ = sum các quỹ

**Given** card "Hôm nay bạn có thể chi tiêu thoải mái"
**When** render
**Then** có mô tả ngắn cách tính (chi linh hoạt 20% thu nhập ÷ số ngày tháng), i18n vi/en, không phá layout 4 stage

**Given** công thức aggregate feasibility đang duplicate ở `route.ts` và `TadaStep.tsx` (deferred [8-1])
**When** story done
**Then** logic share qua helper chung, `npx tsc --noEmit` sạch, tests pass

### Story 9.2: Icon quỹ — picker cho quỹ custom + persist mọi quỹ

As a người dùng tạo quỹ theo ý riêng,
I want chọn icon thể hiện quỹ của tôi và thấy đúng icon đó trong app sau onboarding,
So that quỹ mang bản sắc của tôi, không phải icon target vô hồn giống nhau.

**Acceptance Criteria:**

**Given** user thêm quỹ custom ở GoalStep
**When** form custom mở
**Then** có icon picker (bộ icon Phosphor duotone chọn sẵn ~8-12 icon phù hợp mục tiêu tài chính), mặc định fallback icon nếu user không chọn

**Given** user hoàn thành onboarding với quỹ preset + custom
**When** RPC `complete_onboarding_v2` chạy
**Then** `funds.icon` được ghi đúng cho MỌI quỹ (preset map từ presetId, custom theo user chọn) — migration mới cho RPC nhận icon trong `p_goals`, validate an toàn

**Given** user vào trang Funds sau onboarding
**When** FundCard render
**Then** icon hiển thị đúng theo `fund.icon` (đã render `fund.icon || config.icon` sẵn — verify end-to-end), fallback về config icon nếu null

**Given** i18n + type safety
**When** story done
**Then** strings qua `t()`, `npx tsc --noEmit` sạch, Zod schema onboarding validate icon (string, whitelist hoặc format check)

### Story 9.3: Điều chỉnh quỹ mọi lúc sau onboarding

As a người dùng đã onboarding xong,
I want sửa được mục tiêu, số tháng, icon của các quỹ (kể cả quỹ khẩn cấp) bất cứ lúc nào,
So that kế hoạch tài chính theo kịp cuộc sống thay vì bị khoá cứng từ lúc setup.

**Acceptance Criteria:**

**Given** user mở fund detail của goal fund
**When** bấm edit
**Then** `GoalEditSheet` cho sửa name, target_amount, target_date/months, icon (reuse icon picker từ 9.2); lưu qua `useUpdateFund` PATCH hiện có

**Given** user mở fund detail của emergency fund
**When** xem trang
**Then** có edit affordance (hiện tại KHÔNG có) — sửa được `target_months_expense` (số tháng chi tiêu dự phòng) và icon; `updateFundSchema` bổ sung `target_months_expense`

**Given** fund `is_system = true` hoặc fund type khác (freedom/sinking/investment)
**When** render edit UI
**Then** giữ nguyên hành vi hiện tại (ngoài scope) — không mở edit cho types chưa được duyệt

**Given** user sửa quỹ thành công
**When** mutation xong
**Then** toast.success, query invalidate đúng keys từ factory, số liệu dashboard/funds cập nhật; error → giữ form + toast.error


## Epic 10: Money Model v2 — engine + toán đúng

**Mục tiêu:** Một model tiền duy nhất, khép 100% thu nhập: capacity góp = bucket Tiết kiệm & Đầu tư 15%, allocation engine Hybrid 3 giai đoạn, GoalStep gợi ý khả thi live, Tada kể chuyện có nguồn. Thay hẳn công thức available 19% (đếm trùng "other").

**Nguồn:** Sprint Change Proposal 09-07-2026 + brainstorm-intent.md + research-frameworks.md. Rules: BR-OB-009 → BR-OB-013.

### Story 10.1: Allocation engine thuần 3 giai đoạn

As a hệ thống,
I want một engine thuần duy nhất tính phân bổ góp/tháng cho mọi quỹ theo Hybrid 3 giai đoạn,
So that mọi màn hình (GoalStep, Tada, route, dashboard) đọc cùng một nguồn số.

**Acceptance Criteria:**

**Given** income + danh sách goals (đã xếp hạng) + trạng thái emergency
**When** engine chạy
**Then** trả phân bổ/tháng từng quỹ theo BR-OB-010 (GĐ1 100% emergency đến 1 tháng chi tiêu; GĐ2 70/30; GĐ3 100% goals) + bậc thang hạng BR-OB-011 (70/30; 60/30/10) + timeline hoàn thành từng quỹ

**Given** capacity = savings_investment 15% (BR-OB-009)
**When** story done
**Then** `calculateFeasibility`/`calculateAggregateFeasibility` cũ bị thay bằng engine, "other" không còn trong capacity, route + TadaStep tiêu thụ engine, không còn công thức available 19%

**Given** boundary cases
**When** chạy tests
**Then** pass: income 15tr/40tr/100tr · 0-6 goals · timeline 1-600 tháng · emergency đã đầy một phần · `tsc` + vitest sạch

### Story 10.2: GoalStep gợi ý khả thi live

As a người dùng nhập mục tiêu,
I want thấy ngay "góp X/tháng · xong khoảng [thời điểm]" khi vừa nhập số tiền,
So that mục tiêu hiện hữu và khả thi ngay lúc mơ.

**Acceptance Criteria:**

**Given** user nhập target quỹ (preset hoặc custom)
**When** giá trị thay đổi
**Then** hiện gợi ý live từ engine 10.1 (hạng tạm = thứ tự thêm quỹ); số tụt mood không đứng một mình (BR-OB-012 — kèm ghi chú lối thoát sẽ có ở Tada/Epic 11); i18n vi/en; `tsc` sạch

### Story 10.3: Tada kể chuyện 3 giai đoạn + attribution

As a người dùng hoàn thành setup,
I want Tada kể kế hoạch 3 giai đoạn bằng 1 dòng đơn giản với số per-fund từ engine và nguồn phương pháp,
So that tôi tin kế hoạch và muốn kể ngay cho vợ/chồng.

**Acceptance Criteria:**

**Given** Tada render sau onboarding
**When** hiển thị
**Then** 1 dòng tóm tắt 3 giai đoạn + số góp/tháng per-fund + tổng từ engine (reuse UI Epic 9); dòng attribution (CSP/Sethi · debt bucket 70/20/10 Clason · emergency CFPB); câu chuyện khép 100% thu nhập; invite companion giữ sau reveal; i18n vi/en; vitest pass

## Epic 11: Ưu tiên + Lãi kép

**Mục tiêu:** User xếp hạng ước mơ bằng kéo thả, thấy sức mạnh lãi kép và chặng khả thi cho mục tiêu xa; chi tiết kế hoạch có màn riêng.

**Nguồn:** Sprint Change Proposal 09-07-2026. Rules: BR-OB-011 → BR-OB-013. Phụ thuộc Epic 10 (engine).

### Story 11.1: Kéo thả xếp hạng goals

**Given** ≥2 goal funds trong onboarding
**When** user kéo thả đổi hạng (label màu theo mức ưu tiên)
**Then** tỷ trọng bậc thang + timeline mọi quỹ recalc live qua engine; app advise bằng hint ("quỹ X xong trong N tháng nếu đẩy hạng") không tự đổi hạng; touch ≥44px; i18n vi/en

### Story 11.2: Simulation lãi kép + nắn chặng opt-in

**Given** quỹ có timeline dài
**When** render gợi ý
**Then** simulation 3 tầng 5/6,5/8%/năm (config theo năm T-1) hiện "còn [ngắn hơn] nếu góp qua kênh [tầng]" + disclaimer highlight "tham khảo, không phải cam kết" (BR-OB-013); timeline >10 năm → card "chia chặng?" opt-in 1 chạm (BR-OB-012), user không tap = giữ full target

### Story 11.3: Màn "Kế hoạch chi tiết" hậu Tada

**Given** user bấm "Xem kế hoạch chi tiết" từ Tada
**When** màn mở
**Then** hiện %, tỷ trọng theo hạng, timeline từng quỹ, 3 giai đoạn đầy đủ, kênh gợi ý tham khảo cho quỹ dài hạn; amounts font-mono; không lộ công thức ở Tada chính (giữ câu-1 gọn)
