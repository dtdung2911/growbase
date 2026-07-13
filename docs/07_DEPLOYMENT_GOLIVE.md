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
- Instance type: tối thiểu `t3.small` (2GB RAM). `t2.micro`/`t3.micro` (1GB) build Next.js dễ OOM; nếu buộc dùng 1GB thì BẮT BUỘC thêm swap (mục 3.5). Con số này chỉ đủ cho app Next.js + Nginx (dùng Supabase Cloud §6); nếu self-host Supabase chung máy → RAM này KHÔNG đủ, xem §7.1.
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
- Ghi lại IP tĩnh này → dùng cho bước trỏ domain (§10).

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

(Hoặc tự vận hành Supabase bằng Docker — xem §7. Chọn 1 trong 2.)

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

## 7. Phương án thay thế: Tự vận hành Supabase (self-host Docker)

**Thay cho §6 (Cloud). Chọn 1 trong 2, KHÔNG dùng cả hai.** Nếu đã theo §6 (Supabase Cloud) thì bỏ qua toàn bộ §7. Ở phương án này ta tự chạy full stack Supabase bằng Docker Compose trên hạ tầng của mình (thường là chính EC2 ở §3, hoặc một instance riêng). Code GrowBase KHÔNG đổi — chỉ đổi giá trị 3 biến env kết nối (§7.7).

**LƯU Ý QUAN TRỌNG — cần verify:** Tài liệu self-host của Supabase thay đổi khá nhanh. Các chi tiết dưới đây đối chiếu với `https://supabase.com/docs/guides/self-hosting/docker` (bản đọc 07-2026). Đáng chú ý: bản mới đã chuyển mô hình khoá API — không còn hướng dẫn tự ký `ANON_KEY`/`SERVICE_ROLE_KEY` bằng `JWT_SECRET` như tài liệu cũ, mà dùng cặp khoá ký JWT bất đối xứng + khoá `SUPABASE_PUBLISHABLE_KEY`/`SUPABASE_SECRET_KEY` sinh bằng script kèm stack. Trước khi chạy production PHẢI đọc lại trang trên + trang key model (`.../self-hosting/self-hosted-auth-keys`) để biết chính xác `.env` phiên bản bạn clone dùng model nào (ảnh hưởng trực tiếp §7.3 và §7.7).

### 7.1. Yêu cầu tài nguyên

Full stack Supabase gồm nhiều container: Postgres, GoTrue (auth), PostgREST (REST API), Realtime, Storage, Kong (API gateway), Studio (dashboard), postgres-meta, imgproxy, cùng cụm Analytics (Logflare) + Vector. Tổng RAM tiêu thụ nặng hơn app Next.js nhiều.

- `t3.small` (2GB) ở §3.1 CHỈ đủ cho app + Nginx (phương án Cloud §6). KHÔNG đủ để chạy chung cả full stack Supabase.
- Nếu chạy CHUNG một instance với Next.js (§3): nâng lên **tối thiểu `t3.medium` (4GB RAM), khuyến nghị `t3.large` (8GB)** để có headroom cho Postgres + build Next.js. Vẫn giữ swap (§3.5) và tăng disk gp3 lên ≥ 40GB (Docker images + volume Postgres + Storage).
- Hoặc **tách instance Supabase riêng** (1 máy cho Supabase, 1 máy cho app) — sạch hơn về tài nguyên lẫn bảo mật, nhưng tốn thêm chi phí.
- Giảm tải: cụm Analytics (Logflare) + Vector là phần nặng và không bắt buộc cho GrowBase — có thể tắt để tiết kiệm RAM (comment service `analytics`/`vector` trong `docker-compose.yml` + biến `LOGFLARE_*`). VERIFY: một số bản compose có service phụ thuộc healthcheck của `analytics`, cần gỡ `depends_on` tương ứng nếu không container khác sẽ không khởi động.

Cross-ref: điều chỉnh lại khuyến nghị instance type ở §3.1 theo mục này.

### 7.2. Cài Docker + Docker Compose

Trên Ubuntu (§3), cài Docker Engine + Compose v2 plugin từ repo chính thức của Docker:

```bash
# Gỡ bản cũ nếu có
sudo apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Cho user chạy docker không cần sudo
sudo usermod -aG docker $USER

# Verify — Compose v2 dùng lệnh "docker compose" (KHÔNG phải "docker-compose")
docker --version
docker compose version
```

**BẮT BUỘC — áp group `docker` trước khi chạy tiếp:** `usermod` KHÔNG có hiệu lực với session SSH đang mở. Nếu chạy lệnh docker ngay sẽ gặp `permission denied while trying to connect to the Docker API at unix:///var/run/docker.sock`. Áp group bằng 1 trong 2 cách:

```bash
newgrp docker        # áp ngay cho shell hiện tại (nhanh)
# HOẶC: logout SSH rồi login lại (áp cho mọi session sau)
```

Xác nhận chạy được không cần `sudo` trước khi sang §7.3:

```bash
docker run --rm hello-world
```

### 7.3. Lấy stack + cấu hình `.env`

Clone thư mục `docker/` của Supabase (sparse checkout để chỉ tải phần cần) rồi copy sang một project dir riêng (giữ tách khỏi `/var/www/growbase` của app):

```bash
cd /opt && sudo chown -R $USER:$USER /opt
git clone --filter=blob:none --no-checkout --depth 1 https://github.com/supabase/supabase
cd supabase
git sparse-checkout init --cone
git sparse-checkout set docker
git checkout
cd ..

# Copy stack + env mẫu sang project dir riêng
mkdir -p supabase-project
cp -rf supabase/docker/* supabase-project/
cp supabase/docker/.env.example supabase-project/.env
cd supabase-project
docker compose pull
```

**Sinh secret (KHÔNG dùng giá trị mặc định trong `.env.example` — đây là lỗi bảo mật nghiêm trọng nhất khi self-host).** Cách khuyến nghị hiện hành: chạy script sinh khoá đi kèm stack (đường dẫn theo docs, verify tên/vị trí file):

```bash
# Trong supabase-project — tên script theo docs bản mới, verify trước khi chạy
sh utils/generate-keys.sh
sh utils/add-new-auth-keys.sh
```

Các biến BẮT BUỘC đổi trong `.env` trước khi khởi động (giá trị mẫu chỉ để dev local):

| Biến | Ý nghĩa | Cách sinh / giá trị |
|------|---------|---------------------|
| `POSTGRES_PASSWORD` | Mật khẩu Postgres — dùng cho connection string, psql, migrations §7.6 | mật khẩu mạnh, `openssl rand -base64 24` |
| `JWT_SECRET` | Secret ký JWT (model cũ) — VERIFY còn dùng ở bản của bạn không | ≥ 32 ký tự ngẫu nhiên |
| `ANON_KEY` **hoặc** `SUPABASE_PUBLISHABLE_KEY` | Khoá client (public) → map vào `NEXT_PUBLIC_SUPABASE_ANON_KEY` (§7.7) | sinh bằng script; model cũ = JWT ký bằng `JWT_SECRET` |
| `SERVICE_ROLE_KEY` **hoặc** `SUPABASE_SECRET_KEY` | Khoá server (bypass RLS, bí mật) → map vào `SUPABASE_SERVICE_ROLE_KEY` (§7.7) | sinh bằng script; KHÔNG lộ ra client |
| `SITE_URL` | Domain app production (gốc redirect Auth mặc định) | `https://growbase.com` |
| `API_EXTERNAL_URL` | URL API công khai GoTrue dùng dựng callback | `https://api.growbase.com` |
| `SUPABASE_PUBLIC_URL` | URL gốc truy cập Supabase từ Internet | `https://api.growbase.com` |
| `DASHBOARD_USERNAME` | User basic-auth vào Studio | đổi khác mặc định `supabase` |
| `DASHBOARD_PASSWORD` | Mật khẩu Studio (phải chứa ≥ 1 chữ cái) | mật khẩu mạnh |
| `SECRET_KEY_BASE` | Mã hoá Realtime/Supavisor | ≥ 64 ký tự, `openssl rand -base64 48` |
| `VAULT_ENC_KEY` | Khoá mã hoá cấu hình Supavisor | đúng 32 ký tự, `openssl rand -hex 16` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_ADMIN_EMAIL` / `SMTP_SENDER_NAME` | SMTP gửi email Auth (confirm, reset, invite household) | dùng SES/Postmark/SendGrid... |
| `DISABLE_SIGNUP` | Chặn tự đăng ký nếu chỉ mời nội bộ | `true` để khoá signup (verify tên biến) |

Ngoài ra bản mới còn một số khoá khác cần đổi khỏi giá trị mẫu (VERIFY theo chú thích trong chính `.env` vừa copy): `REALTIME_DB_ENC_KEY` (đúng 16 ký tự, `openssl rand -hex 8`), `PG_META_CRYPTO_KEY` (≥ 32 ký tự), token `LOGFLARE_*`, và `MINIO_ROOT_PASSWORD`/`S3_PROTOCOL_*` nếu dùng Storage backend S3.

Lưu ý env quan trọng cho GrowBase:

- `API_EXTERNAL_URL` và `SUPABASE_PUBLIC_URL` = **subdomain API riêng**, ví dụ `https://api.growbase.com` (bản ghi A trỏ về Elastic IP §3.3 — thêm ở §10 DNS, reverse proxy ở §7.5). ĐÂY KHÔNG PHẢI domain app.
- `SITE_URL` = **domain app production** `https://growbase.com` (nơi user mở GrowBase). Là gốc redirect Auth mặc định — phải khớp Redirect URLs như §6.1 (Site URL, `/auth/callback`, `/login`, `/invite/*`).
- Chưa có SMTP thì có thể bật auto-confirm email để test, nhưng production nên có SMTP thật cho luồng invite household.

### 7.4. Khởi động stack

```bash
cd /opt/supabase-project
docker compose up -d          # hoặc wrapper: sh ./run.sh start  (= up -d --wait)
docker compose ps             # mọi container phải ở trạng thái Up ... (healthy)
```

Xem log nếu có container không healthy:

```bash
docker compose logs kong
docker compose logs auth
docker compose logs db
```

Sau khi đổi bất kỳ biến trong `.env`, phải **recreate** container mới ăn giá trị mới (restart thường không đủ):

```bash
docker compose up -d --force-recreate
```

### 7.5. Reverse proxy + SSL cho Supabase API

Kong lắng nghe HTTP ở cổng **8000** (nên bind `127.0.0.1`). Ta đưa ra Internet qua subdomain API riêng — cùng cơ chế Nginx như app ở §11/§12 nhưng cho `api.growbase.com`. (Kong cũng có cổng HTTPS 8443 ở một số bản, nhưng production khuyến nghị terminate TLS ngay tại Nginx và proxy tới 8000.)

1) DNS — thêm bản ghi A cho subdomain API trỏ về Elastic IP (§3.3), làm cùng chỗ §10 DNS:

| Loại | Host/Name | Value | TTL |
|------|-----------|-------|-----|
| A | `api` (→ `api.growbase.com`) | `<ELASTIC_IP>` | 300 |

2) Nginx server block cho subdomain API (proxy tới Kong 8000):

```bash
sudo nano /etc/nginx/sites-available/growbase-api
```

```nginx
server {
    listen 80;
    server_name api.growbase.com;

    client_max_body_size 50m;   # cho upload Storage nếu dùng

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;      # Realtime (websocket)
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/growbase-api /etc/nginx/sites-enabled/growbase-api
sudo nginx -t && sudo systemctl reload nginx
```

3) SSL cho subdomain API bằng certbot (giống §12; chạy SAU khi `dig +short api.growbase.com` trả đúng Elastic IP):

```bash
sudo certbot --nginx -d api.growbase.com
```

Bảo mật:

- **Studio:** KHÔNG expose cổng 8000 công khai không kiểm soát. Chỉ mở nội bộ qua SSH tunnel (`ssh -L 8000:127.0.0.1:8000 ubuntu@<ELASTIC_IP>`), hoặc thêm server block Nginx riêng cho Studio có HTTP basic auth + giới hạn IP (ngoài basic-auth `DASHBOARD_*` sẵn có).
- **Postgres:** TUYỆT ĐỐI không mở cổng 5432 ra Security Group public (§3.2 chỉ mở 22/80/443). Postgres chỉ nghe localhost trên EC2; psql/migrations (§7.6) chạy ngay trên máy hoặc qua SSH tunnel.

### 7.6. Áp migrations GrowBase vào self-host DB

Self-host đã có sẵn schema `auth` và `storage` như Cloud → `auth.uid()` hoạt động, RLS chạy y hệt môi trường Cloud, không phải sửa policy. Ta chỉ cần áp các migration `public` của GrowBase.

Danh sách migration 001→020 và ý nghĩa: xem §6.2 (KHÔNG lặp lại ở đây). Áp ĐÚNG THỨ TỰ số tăng dần, tuyệt đối không đảo — đặc biệt nhóm Living Plan 018/019/020. Seed `005_seed.sql` nằm giữa dãy nên chạy đúng vị trí của nó.

Cách A — `psql` từng file (chạy trên chính EC2, Postgres ở localhost):

```bash
cd /var/www/growbase   # nơi có supabase/migrations
export PGURL="postgresql://postgres:<POSTGRES_PASSWORD>@localhost:5432/postgres"

for f in $(ls supabase/migrations/*.sql | sort); do
  echo ">> applying $f"
  psql "$PGURL" -v ON_ERROR_STOP=1 -f "$f"
done
```

(`sort` giữ thứ tự 001→020; `ON_ERROR_STOP=1` dừng ngay khi có lỗi thay vì chạy tiếp file sau.)

Cách B — Supabase CLI push tới self-host:

```bash
supabase db push --db-url "postgresql://postgres:<POSTGRES_PASSWORD>@localhost:5432/postgres"
```

Áp xong, kiểm tra như §6.3 (bảng `public`, `member_activity`, RLS bật, RPC onboarding/fund tồn tại, seed 005 đã vào).

### 7.7. Nối GrowBase app vào self-host (`.env.production` trên EC2)

Đổi 3 biến env của app (§5) trỏ về self-host thay cho `*.supabase.co`:

```bash
# /var/www/growbase/.env.production
NEXT_PUBLIC_SUPABASE_URL=https://api.growbase.com                     # = API_EXTERNAL_URL/SUPABASE_PUBLIC_URL self-host, KHÔNG phải *.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY hoặc PUBLISHABLE_KEY self-host>
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY hoặc SECRET_KEY self-host>  # chỉ server, không lộ client
SUPABASE_INTERNAL_URL=http://localhost:8000                          # (tùy chọn) server gọi Kong nội bộ, không ra internet
```

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = khoá client sinh ở §7.3 (`ANON_KEY` model cũ hoặc `SUPABASE_PUBLISHABLE_KEY` model mới — verify theo stack).
- `SUPABASE_SERVICE_ROLE_KEY` = khoá server sinh ở §7.3 (`SERVICE_ROLE_KEY` hoặc `SUPABASE_SECRET_KEY`).
- **`SUPABASE_INTERNAL_URL` (tùy chọn — self-host chung máy)**: khi app và Supabase cùng EC2, 3 client server-side (server/admin/middleware) đọc biến này để gọi thẳng Kong `http://localhost:8000` — không ra internet, không tốn TLS, nhanh hơn. KHÔNG có tiền tố `NEXT_PUBLIC_` (chỉ server, browser vẫn dùng `NEXT_PUBLIC_SUPABASE_URL` public cho auth OAuth/refresh — browser ở máy user không tới được localhost). Không set → mọi client dùng public URL như bình thường (Cloud/dev). Cần Site URL / redirect allowlist self-host (§7.3, §7.8) chứa origin app public. Là biến runtime (không cần rebuild khi đổi).
- Rebuild app để giá trị `NEXT_PUBLIC_*` được nhúng lại (đây là biến build-time; `SUPABASE_INTERNAL_URL` là runtime, không cần rebuild):

```bash
cd /var/www/growbase
npm run build
pm2 restart growbase
```

### 7.8. OAuth (Google) cho self-host

Khác §6 (Cloud): redirect URI KHÔNG còn trỏ về `*.supabase.co` mà về domain API self-host của bạn. GoTrue self-host dùng path callback `/auth/v1/callback`.

- Trong Google Cloud Console → OAuth 2.0 Client → Authorized redirect URIs, thêm:
  `https://api.growbase.com/auth/v1/callback`
- Bật provider Google cho GoTrue self-host qua biến trong `.env` (VERIFY tên biến theo phiên bản, thường dạng `GOTRUE_EXTERNAL_GOOGLE_ENABLED=true`, `..._CLIENT_ID`, `..._SECRET`, `..._REDIRECT_URI=https://api.growbase.com/auth/v1/callback`) rồi recreate container (§7.4). Một số bản cho bật provider trực tiếp trong Studio → Authentication → Providers.
- `SITE_URL` (§7.3) vẫn là `https://growbase.com` để sau khi đăng nhập redirect về app.

### 7.9. Backup + vận hành

Self-host KHÔNG có PITR (point-in-time recovery) managed như Cloud → phải tự backup.

- `pg_dump` định kỳ bằng cron:

```bash
# crontab -e — dump 02:00 hằng ngày (tên container verify bằng docker compose ps)
0 2 * * * docker exec supabase-db pg_dump -U postgres -d postgres | gzip > /var/backups/growbase/db-$(date +\%F).sql.gz
```

- Backup docker volumes (Postgres data + Storage): backup thư mục `volumes/` trong `supabase-project` + EBS snapshot của EC2. Giữ backup ngoài máy chủ (vd sync lên S3).
- Update stack:

```bash
cd /opt/supabase-project
docker compose pull
docker compose up -d
```

- Monitor: RAM/disk là điểm nghẽn chính khi self-host (§7.1). Theo dõi `docker stats`, `df -h`, `free -m` — gộp cùng phần monitoring §17.
- Rollback DB self-host: restore từ `pg_dump` gần nhất (không có PITR managed) — cân nhắc khi lập kế hoạch rollback §16.

## 8. Build và chạy ứng dụng

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

## 9. Chạy bằng PM2

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

## 10. Trỏ domain về server (DNS)

Phải hoàn tất TRƯỚC khi chạy certbot (§12) — Let's Encrypt cần domain resolve đúng về Elastic IP và cổng 80 mở (Security Group, mục 3.2).

### 10.1. Tạo bản ghi A

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

### 10.2. Chờ propagation + xác minh

```bash
dig +short growbase.com          # phải trả về <ELASTIC_IP>
dig +short www.growbase.com
# hoặc: nslookup growbase.com
```

TTL 300 → thường vài phút; đổi nameserver (Route 53) có thể mất tới 24-48h. CHỈ chạy certbot khi lệnh `dig` trả đúng Elastic IP.

### 10.3. Cập nhật server_name

Đảm bảo `server_name` trong Nginx (§11) khớp cả `growbase.com www.growbase.com`.

## 11. Cấu hình Nginx

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

Đảm bảo `server_name` khớp domain đã trỏ DNS ở §10 (gồm cả `www`).

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

## 12. Bật HTTPS

Yêu cầu trước: domain đã resolve đúng về Elastic IP (§10) và Security Group đã mở cổng 80/443 (mục 3.2). Certbot dùng HTTP-01 challenge qua cổng 80, nên nếu DNS chưa trỏ hoặc cổng 80 bị chặn thì việc cấp chứng chỉ sẽ fail.

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

## 13. Quy trình deploy release mới

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

## 14. Smoke test sau Go-live

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

## 15. Checklist Go/No-Go

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

## 16. Rollback

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

## 17. Monitoring vận hành

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

## 18. Các lỗi thường gặp

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

### Docker: permission denied /var/run/docker.sock (self-host §7)

```text
permission denied while trying to connect to the Docker API at unix:///var/run/docker.sock
```

User `ubuntu` chưa được áp group `docker` trong session hiện tại — đã chạy `sudo usermod -aG docker $USER` (§7.2) nhưng chưa áp group. Sửa:

```bash
newgrp docker          # áp ngay cho shell hiện tại
# HOẶC logout SSH rồi login lại
docker run --rm hello-world   # verify chạy không cần sudo
```

Tạm thời có thể `sudo docker compose ...`, nhưng áp group là cách đúng lâu dài.

## 19. Go-live sign-off

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
