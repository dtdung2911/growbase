# Hotfix batch — Browser test 11-07-2026 (post Epic 12+13)

Nguồn: user test toàn diện sau Living Plan. 9 vấn đề. Status: investigating.

| # | Vấn đề | Loại | Status |
|---|---|---|---|
| 1 | savings=income−expense (DashboardView:50, route:107); fund_contribution đang đếm vào totalExpense (route không select transaction_type)! Fix: sum fund_contribution riêng → card Tiết kiệm + rate = góp/income; expense loại fund ops | bug nghiệp vụ | root-caused |
| 2 | Dashboard fund cards icon không đồng bộ (không dùng fund.icon Epic 9) | sync UI | investigating |
| 3 | Bảng Ngân sách desktop cần UI giống mobile — MỌI nơi có bảng ngân sách | UI | investigating |
| 4 | Trang Giao dịch: hiển thị loại danh mục (cost type: lãng phí/cố định/phát sinh/tiết kiệm/trả nợ...) per giao dịch + bộ lọc theo loại | feature | investigating |
| 5 | FundCard CHƯA TỪNG có Link (root div thuần, entry duy nhất từ dashboard FundOverviewCard). Fix: wrap Link /funds/[id], buttons stopPropagation | bug | root-caused |
| 6 | monthly_contribution DEFAULT 0, RPC onboarding không set; presets nhân từ nó (ContributeModal:98-102). Fix: base = suggestedAmount ?? monthly | bug | root-caused |
| 7 | Cột phân bổ ngân sách tính trên income onboarding, cần theo income THỰC tháng — MỌI bảng ngân sách (user chốt nghiệp vụ) | nghiệp vụ | investigating |
| 8 | Trang tài sản ròng: đồng bộ icon quỹ | sync UI | investigating |
| 9 | Invite chỉ copy link (không email); middleware 0-household → /setup; /setup KHÔNG lookup household_invitations theo email (RLS chặn client — cần API service-role). Fix: API GET pending-invites by email + màn Join/Create trước wizard trong SetupClient | bug flow | root-caused |

## Kế hoạch đợt

- Đợt A (bugs): 1, 5, 6, 9 + icons 2, 8
- Đợt B (nghiệp vụ): 7 (phân bổ theo income thực — pattern living plan)
- Đợt C (UI/feature): 3 (budget table responsive), 4 (cost type badge + filter)
- Mỗi đợt: dev agent → tsc/vitest → review nhẹ → user browser-verify cuối.


## Kết quả (11-07-2026, sau 3 đợt dev)

- **Đợt A** (bugs 1,5,6,9 + icons 2,8): DONE — dashboard savings=fund_contributions + expense loại fund ops (transaction_type-based); FundCard wrap Link; presets base suggestedAmount ẩn khi 0; icon select thêm ở dashboard/net-worth API + fallback render; invite: API /invitations/pending (supabaseAdmin by email) + InvitedScreen trong SetupClient (Join/Create).
- **Đợt B** (#7): DONE — migration 019 get_budget_with_actuals income THỰC tháng (fallback income_sources); cả 3 UI budget tự đúng.
- **Đợt C** (#3,#4): DONE — BudgetClient/DashboardView budget/BudgetVsActualTab bỏ desktop table dùng card-style md:grid-cols-2 mọi breakpoint (xóa dead CostTypeSection/BudgetGroupRows); cost type badge màu (costTypeBadge.ts, reuse behavior.* labels) + filter FilterBar client-side.

Verify batch: tsc 0 · 529 tests · next build pass · i18n parity 866. Migration 019 supabase local verified.
