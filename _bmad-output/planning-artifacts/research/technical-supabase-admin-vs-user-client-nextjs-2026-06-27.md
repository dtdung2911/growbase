# Technical Research: Supabase Admin vs User Client trong Next.js App Router

**Date:** 2026-06-27  
**Author:** DzungDuong  
**Topic:** Khi nào dùng service role (admin) vs user client (RLS) trong API routes  

---

## 1. Tổng quan hai client

| | `createClient()` (user client) | `supabaseAdmin` (service role) |
|---|---|---|
| Key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `SUPABASE_SERVICE_ROLE_KEY` (server-only) |
| Auth scope | Dùng JWT của user (cookie session) | Dùng service role JWT — quyền DB owner |
| RLS | **Enforced** — policies chạy với `auth.uid()` | **Bypassed** — không có policy nào chạy |
| Use case | Mọi user-facing ops | Admin ops, background jobs, webhooks |

---

## 2. Khuyến nghị của Supabase (2025/2026)

**Supabase docs (server-side/creating-a-client):**
> "Use the user/cookie client in Server Components and API routes for user-scoped operations with RLS. Use admin/service-role only for webhooks and cron tasks that act outside user context."

**Pattern khuyến nghị cho Next.js App Router:**
```typescript
// Server Components, API routes → user client
const supabase = createServerClient(url, anonKey, { cookies })
// Auth check
const { data: { user } } = await supabase.auth.getUser()
// Data query → RLS enforced tự động
const { data } = await supabase.from("transactions").select()

// Admin ops → service role (webhooks, migrations, cron)
const supabaseAdmin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})
```

**Note 2025+:** Supabase giới thiệu `getClaims()` thay `getUser()` cho performance tốt hơn (không network round-trip).

---

## 3. Trade-offs

### Dùng `supabaseAdmin` cho mọi data ops (pattern hiện tại của GrowBase)

**Ưu:**
- Đơn giản hơn — không cần viết RLS policies
- Không bị bug "RLS block unexpectedly"
- Phù hợp team nhỏ, iteration nhanh

**Nhược:**
- **Security boundary hoàn toàn nằm ở app code** — nếu một route bỏ sót household_id check, user A có thể đọc data của user B
- RLS là "defense in depth" — mất lớp bảo vệ thứ 2
- Khó audit: không thể verify security bằng cách đọc DB policies, phải đọc từng route

### Dùng user client + RLS cho data ops

**Ưu:**
- DB là security boundary — RLS enforce `auth.uid()` match, không thể bypass dù app code có bug
- Audit dễ hơn: policies là single source of truth cho access control
- Supabase best practice chính thức

**Nhược:**
- Phải viết và maintain RLS policies cho mọi table
- Cross-table queries phức tạp hơn (JOIN qua household_members cần policy đúng)
- Refactor lớn nếu schema hiện tại chưa có policies đầy đủ

---

## 4. Hybrid pattern (khuyến nghị thực tế)

Nhiều production apps dùng hybrid:

```
User client (RLS on)     → mọi user-facing queries (SELECT, INSERT, UPDATE)
Admin client (RLS off)   → chỉ khi cần bypass: invitations, onboarding, fund RPC, batch ops
```

**Rule phân biệt:**
- Hành động **nhân danh user** → user client
- Hành động **nhân danh system** (create household, send invite email, trigger batch) → admin client

---

## 5. Khuyến nghị cho GrowBase

**Short-term (không refactor):** Giữ pattern hiện tại (admin client) nhưng enforce app-level guard nghiêm hơn:
- `withAuth()` **bắt buộc** mọi route (fix bug đã phát hiện)
- Mọi query phải filter `household_id` = household của user đang login
- Không cần RLS policies vì admin client bypass, nhưng app code là security gate

**Long-term (recommended):** Migrate sang user client cho data ops:
- Viết RLS policies cho các tables chính (transactions, funds, accounts...)
- Policy pattern: `auth.uid() IN (SELECT user_id FROM household_members WHERE household_id = table.household_id)`
- Admin client chỉ dùng cho: onboarding create household, invite tokens, fund RPC atomicity cần service role

**Verdict cho architecture spine:** Đây là **trade-off có chủ đích** cần ghi rõ trong spine. Pattern hiện tại (admin client) là valid nếu app-level guard được enforce nghiêm — nhưng cần document rõ security model là "app-level, không phải DB-level".

---

## Sources

- [Supabase: Creating a Server-Side Client](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Service Role Key in Next.js — Best Practices 2026](https://www.iloveblogs.blog/post/supabase-service-role-key-nextjs)
- [Supabase Community Discussion #30739](https://github.com/orgs/supabase/discussions/30739)
- [Starmorph: RLS in Next.js](https://blog.starmorph.com/blog/row-level-security-supabase-tables-nextjs)
