# Growbase Deployment & Go-live Runbook

Tài liệu này mô tả quy trình triển khai Growbase lên server production và checklist Go-live. Mục tiêu là deploy có kiểm soát, có kiểm chứng, có phương án rollback.

## 1. Phạm vi hệ thống

Growbase là ứng dụng Next.js 14 chạy bằng Node.js server runtime, sử dụng Supabase cho Auth, Database, RLS và RPC.

Thành phần production:

- Web app: Next.js, chạy `next start`
- Process manager: PM2
- Reverse proxy: Nginx
- Database/Auth: Supabase project production
- Runtime env: `.env.production` hoặc biến môi trường trên server

Scripts chính trong `package.json`:

```bash
npm run build
npm run start
npm run type-check
npm test
```

Biến môi trường bắt buộc:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Không commit giá trị thật của các biến này.

## 2. Điều kiện trước khi Go-live

Chỉ Go-live khi các điều kiện sau đạt:

- Branch deploy đã được merge hoặc checkout đúng commit release.
- `git status` trên server sạch sau khi pull/checkout.
- `npm ci` chạy thành công.
- `npm run type-check` pass.
- `npm test` pass hoặc danh sách test không chạy được đã có lý do rõ ràng.
- `npm run build` pass.
- Supabase production đã apply đủ migrations từ `supabase/migrations/001_enums.sql` đến migration mới nhất.
- Supabase Auth redirect URLs đã trỏ đúng domain production.
- Nginx HTTPS hoạt động.
- Có phương án rollback về commit trước.

## 3. AWS EC2 — Khởi tạo máy chủ

### 3.1. Launch instance

- AWS Console → EC2 → Launch instance.
- AMI: Ubuntu Server 24.04 LTS (hoặc 22.04 LTS), 64-bit x86.
- Instance type: tối thiểu `t3.small` (2GB RAM). `t2.micro`/`t3.micro` (1GB) build Next.js dễ OOM; nếu buộc dùng 1GB thì BẮT BUỘC thêm swap (mục 3.5).
- Key pair: tạo mới (RSA `.pem`) hoặc chọn key có sẵn — TẢI VỀ và giữ kỹ file `.pem`.
- Storage: gp3 tối thiểu 20GB.
- Network: cho phép tạo Security Group mới (cấu hình ở mục 3.2).

### 3.2. Security Group (inbound rules)

BẮT BUỘC cấu hình đúng, nếu sai thì Nginx/certbot/domain đều fail.

| Type | Port | Source | Ghi chú |
|------|------|--------|---------|
| SSH | 22 | My IP (khuyến nghị) hoặc `0.0.0.0/0` | truy cập SSH |
| HTTP | 80 | `0.0.0.0/0` + `::/0` | Nginx + certbot HTTP-01 challenge |
| HTTPS | 443 | `0.0.0.0/0` + `::/0` | traffic production |

Outbound để mặc định (allow all). Lưu ý: `ufw` trên Ubuntu là tầng thứ 2 — nếu bật `ufw` thì phải allow 22/80/443. Security Group là tầng AWS, bắt buộc mở trước.

### 3.3. Elastic IP

BẮT BUỘC. Nếu không gán, public IP đổi mỗi lần stop/start → vỡ DNS.

- EC2 → Elastic IPs → Allocate → Associate với instance.
- Ghi lại IP tĩnh này → dùng cho bước trỏ domain (§9).

### 3.4. Kết nối SSH

```bash
chmod 400 growbase-key.pem
ssh -i growbase-key.pem ubuntu@<ELASTIC_IP>
```

User mặc định của Ubuntu AMI là `ubuntu`; chấp nhận host fingerprint ở lần kết nối đầu.

### 3.5. Cập nhật hệ thống + swap

Khuyến nghị mạnh cho server ≤ 2GB RAM.

```bash
sudo apt update && sudo apt upgrade -y
# Swap 2GB — tránh OOM khi npm run build
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h   # xác nhận swap đã active
```

### 3.6. Timezone

App dùng GMT+7 cho logic tháng/hoạt động.

```bash
sudo timedatectl set-timezone Asia/Ho_Chi_Minh
```

## 4. Chuẩn bị server

Khuyến nghị server tối thiểu:

- Ubuntu 22.04 hoặc 24.04 LTS
- Node.js 20 LTS
- npm đi kèm Node.js
- Nginx
- PM2
- Git
- Certbot nếu dùng Let's Encrypt

Cài package nền:

```bash
sudo apt update
sudo apt install -y git nginx curl build-essential
```

Cài Node.js 20 LTS. Có thể dùng NodeSource hoặc `nvm`. Ví dụ với NodeSource:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

Cài PM2:

```bash
sudo npm install -g pm2
pm2 -v
```

Tạo thư mục app:

```bash
sudo mkdir -p /var/www/growbase
sudo chown -R $USER:$USER /var/www/growbase
```

Clone code:

```bash
cd /var/www
git clone <REPO_URL> growbase
cd /var/www/growbase
```

Checkout đúng branch hoặc tag release:

```bash
git fetch --all --tags
git checkout main
git pull --ff-only
```

## 5. Cấu hình biến môi trường

Tạo file env production trên server:

```bash
cd /var/www/growbase
nano .env.production
```

Nội dung:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<production-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<production-service-role-key>
```

Quyền file:

```bash
chmod 600 .env.production
```

Lưu ý:

- `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` được dùng ở browser và server.
- `SUPABASE_SERVICE_ROLE_KEY` chỉ được dùng ở server. Không expose ra client.
- Không dùng key Supabase local/staging cho production.

## 6. Chuẩn bị Supabase production

### 6.1. Tạo project production

Trong Supabase dashboard:

- Tạo project production riêng.
- Lưu `Project URL`, `anon public key`, `service_role key`.
- Bật email provider hoặc OAuth provider theo nhu cầu.
- Cấu hình domain redirect cho Auth.

Auth URLs cần kiểm tra:

- Site URL: `https://<production-domain>`
- Redirect URLs:
  - `https://<production-domain>/auth/callback`
  - `https://<production-domain>/login`
  - `https://<production-domain>/invite/*`

### 6.2. Apply migrations

Migrations hiện có:

```text
001_enums.sql
002_tables.sql
003_functions.sql
004_rls.sql
005_seed.sql
006_onboarding.sql
007_s2_transaction_update_trigger.sql
008_s3_system_balances.sql
009_s4_budget_baselines_list.sql
010_sprint_cd.sql
011_onboarding_v2.sql
012_lockdown_onboarding_v2_rpc.sql
013_onboarding_multi_goal.sql
014_member_activity.sql
015_member_activity_hardening.sql
016_onboarding_rpc_hardening.sql
017_onboarding_fund_icon.sql
018_priority_rank.sql
019_budget_actual_income.sql
020_fix_income_type.sql
```

Các migration bổ sung gần đây (vẫn apply theo đúng thứ tự số tăng dần, không đảo):

- `015_member_activity_hardening.sql` — siết RLS ghi hoạt động đúng household + chặn `active_date` tương lai/backdate, default theo giờ VN.
- `016_onboarding_rpc_hardening.sql` — hardening `complete_onboarding_v2`: advisory lock chống double-submit, giới hạn số quỹ, localize tên do server tạo, trả về `household_id` + `fund_ids`.
- `017_onboarding_fund_icon.sql` — lưu `funds.icon` chọn ở bước onboarding.
- `018_priority_rank.sql` — Living Plan: thêm cột `funds.priority_rank` (hạng quỹ sống) + backfill goal funds.
- `019_budget_actual_income.sql` — Living Plan: `get_budget_with_actuals()` phân bổ ngân sách theo thu nhập THỰC của tháng đang xem.
- `020_fix_income_type.sql` — Living Plan: backfill các income nhập qua QuickAdd bị lưu nhầm `transaction_type='expense'`.

Ba migration 018/019/020 thuộc nhóm Living Plan (priority_rank, budget theo income thực, fix income type) — bắt buộc apply đủ để dashboard/budget tính đúng.

Khuyến nghị apply bằng Supabase CLI đã link tới production project:

```bash
supabase login
supabase link --project-ref <production-project-ref>
supabase db push
```

Nếu không dùng CLI, apply thủ công từng file SQL theo đúng thứ tự trong Supabase SQL Editor. Không đảo thứ tự migrations.

### 6.3. Kiểm tra database sau migration

Kiểm tra các nhóm chính:

- Bảng household/account/category/transaction/fund tồn tại.
- Bảng onboarding v2/multi-goal tồn tại.
- Bảng `member_activity` tồn tại.
- RLS đang bật cho bảng user data.
- RPC onboarding và fund functions tồn tại.
- Seed data cần thiết đã có nếu app phụ thuộc preset/category defaults.

SQL kiểm tra nhanh:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```

Kiểm tra `member_activity`:

```sql
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'member_activity'
order by ordinal_position;
```

## 7. Build và chạy ứng dụng

Cài dependencies:

```bash
cd /var/www/growbase
npm ci
```

Chạy kiểm tra trước build:

```bash
npm run type-check
npm test
```

Build production:

```bash
npm run build
```

Chạy thử local trên server:

```bash
PORT=3000 npm run start
```

Mở terminal khác và kiểm tra:

```bash
curl -I http://127.0.0.1:3000/login
curl -I http://127.0.0.1:3000/
```

Nếu OK, dừng process test bằng `Ctrl+C`.

## 8. Chạy bằng PM2

Tạo file ecosystem:

```bash
nano ecosystem.config.cjs
```

Nội dung:

```js
module.exports = {
  apps: [
    {
      name: "growbase",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: "/var/www/growbase",
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "512M",
    },
  ],
}
```

Start app:

```bash
pm2 start ecosystem.config.cjs
pm2 status
pm2 logs growbase --lines 100
```

Lưu PM2 process list:

```bash
pm2 save
pm2 startup
```

Chạy command mà `pm2 startup` in ra với quyền `sudo`.

## 9. Trỏ domain về server (DNS)

Phải hoàn tất TRƯỚC khi chạy certbot (§11) — Let's Encrypt cần domain resolve đúng về Elastic IP và cổng 80 mở (Security Group, mục 3.2).

### 9.1. Tạo bản ghi A

Trỏ cả domain gốc và `www` về Elastic IP (mục 3.3):

| Loại | Host/Name | Value | TTL |
|------|-----------|-------|-----|
| A | `@` (hoặc `growbase.com`) | `<ELASTIC_IP>` | 300 |
| A | `www` | `<ELASTIC_IP>` | 300 |

**Cách A — Registrar bất kỳ (Namecheap/GoDaddy/Cloudflare...):** vào phần DNS / Advanced DNS của domain → thêm 2 bản ghi A như trên. Với Cloudflare: tắt proxy (mây xám) khi chạy certbot lần đầu, bật lại sau nếu muốn.

**Cách B — AWS Route 53 (khuyến nghị nếu domain quản lý trên AWS):**

- Route 53 → Hosted zones → tạo hosted zone cho domain.
- Đổi nameservers tại registrar sang 4 NS mà Route 53 cấp.
- Create record: A record `@` → Elastic IP; A record `www` → Elastic IP (hoặc dùng alias).

### 9.2. Chờ propagation + xác minh

```bash
dig +short growbase.com          # phải trả về <ELASTIC_IP>
dig +short www.growbase.com
# hoặc: nslookup growbase.com
```

TTL 300 → thường vài phút; đổi nameserver (Route 53) có thể mất tới 24-48h. CHỈ chạy certbot khi lệnh `dig` trả đúng Elastic IP.

### 9.3. Cập nhật server_name

Đảm bảo `server_name` trong Nginx (§10) khớp cả `growbase.com www.growbase.com`.

## 10. Cấu hình Nginx

Tạo config:

```bash
sudo nano /etc/nginx/sites-available/growbase
```

Nội dung mẫu:

```nginx
server {
    listen 80;
    server_name <production-domain>;

    client_max_body_size 10m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_cache_bypass $http_upgrade;
    }
}
```

Đảm bảo `server_name` khớp domain đã trỏ DNS ở §9 (gồm cả `www`).

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/growbase /etc/nginx/sites-enabled/growbase
sudo nginx -t
sudo systemctl reload nginx
```

Kiểm tra HTTP:

```bash
curl -I http://<production-domain>/login
```

## 11. Bật HTTPS

Yêu cầu trước: domain đã resolve đúng về Elastic IP (§9) và Security Group đã mở cổng 80/443 (mục 3.2). Certbot dùng HTTP-01 challenge qua cổng 80, nên nếu DNS chưa trỏ hoặc cổng 80 bị chặn thì việc cấp chứng chỉ sẽ fail.

Cài Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Cấp chứng chỉ:

```bash
sudo certbot --nginx -d <production-domain>
```

Kiểm tra auto renew:

```bash
sudo certbot renew --dry-run
```

Kiểm tra HTTPS:

```bash
curl -I https://<production-domain>/login
```

## 12. Quy trình deploy release mới

Trên server:

```bash
cd /var/www/growbase
git fetch --all --tags
git status
git pull --ff-only
npm ci
npm run type-check
npm test
npm run build
pm2 restart growbase
pm2 logs growbase --lines 100
```

Nếu release có migration mới:

```bash
supabase db push
```

Thứ tự khuyến nghị:

1. Backup DB hoặc tạo restore point trên Supabase.
2. Apply migration production.
3. Deploy app.
4. Smoke test.
5. Theo dõi logs.

Không deploy app mới nếu migration bắt buộc chưa apply.

## 13. Smoke test sau Go-live

Chạy kiểm tra kỹ thuật:

```bash
curl -I https://<production-domain>/login
curl -I https://<production-domain>/
pm2 status
pm2 logs growbase --lines 100
sudo tail -n 100 /var/log/nginx/error.log
```

Kiểm tra bằng browser:

- Mở `/login`.
- Đăng nhập hoặc tạo tài khoản test.
- Hoàn tất onboarding nếu tài khoản mới.
- Vào dashboard.
- Tạo account.
- Tạo transaction income/expense.
- Tạo fund.
- Contribute vào fund.
- Vào settings/members.
- Tạo invite household.
- Mở invite link ở browser khác hoặc incognito.
- Kiểm tra dashboard không lỗi khi reload.

Kiểm tra Supabase:

- Auth user mới xuất hiện.
- Household/member được tạo đúng.
- Data có `household_id` đúng.
- RLS không cho user ngoài household đọc data.
- `member_activity` ghi `active_date` theo ngày Việt Nam.

SQL kiểm tra `member_activity`:

```sql
select user_id, household_id, active_date, created_at
from member_activity
order by created_at desc
limit 20;
```

## 14. Checklist Go/No-Go

Go-live chỉ tiếp tục nếu tất cả mục dưới đây đạt:

- Domain trỏ đúng IP server.
- HTTPS valid.
- `npm run build` pass trên server.
- PM2 process `growbase` online.
- Nginx proxy hoạt động.
- Login page render được.
- Auth callback hoạt động.
- Dashboard load được sau login.
- API routes không trả lỗi 500 trong smoke test.
- Supabase migrations đã apply đủ.
- RLS đã bật và không bị bypass ngoài ý muốn.
- Không có secret production trong git.
- Rollback commit đã được ghi lại.

Ghi lại commit release:

```bash
git rev-parse HEAD
```

## 15. Rollback

Rollback app về commit trước:

```bash
cd /var/www/growbase
git fetch --all --tags
git checkout <previous-good-commit>
npm ci
npm run build
pm2 restart growbase
pm2 logs growbase --lines 100
```

Nếu migration đã thay đổi schema:

- Không tự rollback DB bằng tay nếu chưa có script down migration.
- Ưu tiên restore Supabase backup/point-in-time recovery nếu schema/data bị lỗi nặng.
- Nếu lỗi chỉ ở app, rollback app trước và giữ DB nguyên nếu backward-compatible.

## 16. Monitoring vận hành

Theo dõi app:

```bash
pm2 status
pm2 monit
pm2 logs growbase --lines 200
```

Theo dõi Nginx:

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

Theo dõi server:

```bash
df -h
free -m
top
```

Supabase cần theo dõi:

- API errors
- Auth errors
- Database CPU/RAM
- Slow queries
- RLS denied requests bất thường

## 17. Các lỗi thường gặp

### App build fail vì env thiếu

Kiểm tra `.env.production`:

```bash
cat .env.production
```

Không in file này ở nơi public vì có secret.

### Login redirect về localhost

Kiểm tra Supabase Auth:

- Site URL phải là domain production.
- Redirect URL phải có `/auth/callback`.

### App chạy PM2 nhưng Nginx trả 502

Kiểm tra:

```bash
pm2 status
pm2 logs growbase --lines 100
sudo nginx -t
sudo tail -n 100 /var/log/nginx/error.log
```

Nguyên nhân thường gặp:

- App không chạy port 3000.
- PM2 process crash.
- Nginx `proxy_pass` sai port.

### API trả 500 sau login

Kiểm tra:

- `SUPABASE_SERVICE_ROLE_KEY` đúng production project.
- Migrations đã apply đủ.
- RLS policy không thiếu.
- User có household membership.

### User activity không tính đúng ngày

Kiểm tra route heartbeat đã deploy bản có `active_date: todayVN()`. Sau đó kiểm tra:

```sql
select active_date, created_at
from member_activity
order by created_at desc
limit 20;
```

## 18. Go-live sign-off

Trước khi thông báo production live, ghi lại:

```text
Release commit:
Deploy time:
Domain:
Supabase project ref:
Migration latest:
Smoke test owner:
Rollback commit:
Go-live decision: GO / NO-GO
Notes:
```

Sau khi GO:

- Theo dõi logs ít nhất 30-60 phút đầu.
- Không deploy tiếp thay đổi không khẩn cấp trong cùng khung theo dõi.
- Ghi nhận lỗi production nếu có vào backlog hoặc incident log.
