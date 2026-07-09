# Research: Income-Allocation Frameworks (09-07-2026)

> Nguồn cho money model GrowBase — feed Sprint Change Proposal + PRD. Mọi claim có URL trong mục cuối.

## Catalog (credibility-ranked)

| # | Framework | Split | Nguồn | Credibility | Điểm yếu |
|---|-----------|-------|-------|-------------|----------|
| 1 | 50/30/20 | Needs 50 / Wants 30 / Savings 20 (after-tax) | Elizabeth Warren & A.W. Tyagi, *All Your Worth* (2005) | Học giả Harvard + nhận diện cao nhất, ngân hàng adopt | Needs 50% phi thực tế ở đô thị đắt đỏ; ranh giới mờ |
| 2 | **Conscious Spending Plan** | Fixed 50-60 (GỒM debt) / Invest 10 / Savings 5-10 (= GOAL bucket) / Guilt-free 20-35 | Ramit Sethi, *IWT* (2009, 2019) | NYT bestseller 1M+, Netflix 2023 | Range rộng; không academic; US-centric |
| 3 | Fidelity 50/15/5 | Essentials ≤50 (take-home) / Retirement 15 (pretax) / Short-term savings 5 | Fidelity institutional | Benchmark ngành hưu trí | Trộn 2 income base; không debt bucket |
| 4 | Pay Yourself First | Save ≥10% trước tiên | Clason, *Richest Man in Babylon* (1926) | Classic 100 năm | 10% thấp; parable |
| 5 | 6 Jars | 55/10/10/10/10/5 | T. Harv Eker (2005) | Bestseller nhưng seminar-marketing | Tier thấp nhất; cứng |
| 6 | Ramsey Baby Steps | $1k → hết nợ → emergency 3-6 tháng → 15% gross hưu trí → goals | *Total Money Makeover* (2003) | Audience khổng lồ; sequencing độc đáo | Giả định 12% return bị bác |
| 7 | 70/20/10 | Living 70 / Save+invest 20 / Debt 10 | Gốc Clason 1926 (7/10 sống, 2/10 trả nợ, 1/10 tiết kiệm) | Duy nhất có DEBT bucket riêng | Folk rule, không tác giả hiện đại |

## Chuẩn emergency fund (đồng thuận thể chế)
- CFPB / CFP Board / Vanguard / Fidelity: **3-6 tháng CHI TIÊU thiết yếu** (expenses, KHÔNG phải income). CFPB tách: spending shock (~nửa tháng/$2k) vs income shock (3-6 tháng).
- Code hiện tại `estimateEmergencyTarget = 3 × 81% income` = 3 tháng chi tiêu ✓ khớp chuẩn.

## Nền học thuật
- Thaler, "Mental Accounting and Consumer Choice" (*Marketing Science*, 1985); Nobel 2017. Bucket/envelope = non-fungibility tạo self-control. Bảo chứng cho KIẾN TRÚC fund/bucket, độc lập con số %.
- KHÔNG có chuẩn government/academic cho % cụ thể. Industry: 10-20% tổng saving; 15% pretax retirement (Fidelity).

## Mapping GrowBase 53/24/15/8

- **Best numeric fit: CSP** — fixed 53 ∈ [50-60] ✓, flex 24 ∈ [20-35] ✓, save+invest 15 ∈ [15-20] ✓.
- Caveat debt: CSP gộp debt vào fixed → hộ có nợ = 61% (lệch 1 điểm). Framing đúng: GrowBase TÁCH bucket fixed của CSP thành fixed + debt (theo truyền thống 70/20/10 của Clason).
- **Best structural fit: 70/20/10** (duy nhất có debt bucket).

### Copy attribution dùng được (đã verify):
> "Mẫu ngân sách 53/24/15/8 của GrowBase dựa trên Conscious Spending Plan (Ramit Sethi): chi phí cố định 50-60%, chi tiêu linh hoạt 20-35%, tiết kiệm & đầu tư 15-20% — bổ sung mục trả nợ riêng theo quy tắc 70/20/10 (gốc Clason 1926), nhất quán với 50/30/20 (Warren, 2005)."

### TRÁNH claim: "theo chuẩn 50/30/20" (số thực 53/61 ≠ 50); mọi ngụ ý academic/government endorse con số cụ thể.

## Công thức capacity góp GOAL funds (lõi app) — synthesis trích dẫn được

Trong bucket 15% tiết kiệm & đầu tư:
1. **Emergency trước** đến 3-6 tháng chi tiêu thiết yếu (CFPB/CFP/Vanguard).
2. **Goal funds: 5-10% net income** (Sethi savings bucket — by definition là bucket mục tiêu: mua nhà, du lịch...; corroborate Fidelity 5% short-term).
3. Phần còn lại (~10%) → đầu tư dài hạn.
4. Thứ tự ưu tiên emergency → debt → invest → goals: citable Ramsey Baby Steps; behavioral support từ Kellogg study (small-balance-first).

## URLs
Bankrate 50/30/20 · iwillteachyoutoberich.com/conscious-spending-basics · fidelity.com/mymoneybasics/50-15-5-saving-spending-rule · harveker.com 6-jars · ramseysolutions.com/budgeting/budget-percentages · wallethub.com 70-20-10 · consumerfinance.gov emergency-fund guide · letsmakeaplan.org (CFP) · vanguard get-ahead-of-unexpected-expenses · fidelity save-for-an-emergency · Thaler 1985 PDF (bear.warrington.ufl.edu) · fidelity savings-rate-calculation · tiaa.org how-much-save · time.com 60/30/10 critique
