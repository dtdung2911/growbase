# Prompt: Implement Login Page — GrowBase

## Context
Implement màn hình login theo đúng design spec bên dưới.
File cần tạo/cập nhật: `src/app/(auth)/login/page.tsx`
Đọc `CLAUDE.md` trước khi bắt đầu.

---

## Design Tokens — BẮT BUỘC dùng chính xác

```typescript
// Thêm vào tailwind.config.ts → theme.extend.colors
colors: {
  brand: {
    DEFAULT:  '#0084DB',
    hover:    '#006BB8',
    pressed:  '#004F8A',
    tint:     '#EBF5FF',
  },
}

// Custom CSS variables — thêm vào globals.css
:root {
  /* Light mode */
  --login-page-bg:        #F5F9FF;
  --login-panel-bg:       #EBF5FF;
  --login-form-bg:        #FFFFFF;
  --login-border:         #DBEAFE;
  --login-text-primary:   #05101A;
  --login-text-muted:     #94A3B8;
  --login-text-secondary: #64748B;
  --login-input-bg:       #F8FAFC;
  --login-browser-bar:    #EFF6FF;
}

.dark {
  /* Dark mode */
  --login-page-bg:        #05101A;
  --login-panel-bg:       #030C13;
  --login-form-bg:        #05101A;
  --login-border:         #172A3A;
  --login-text-primary:   #EFF6FF;
  --login-text-muted:     #3D617A;
  --login-text-secondary: #64748B;
  --login-input-bg:       transparent;
  --login-browser-bar:    #030C13;
}
```

---

## File: `src/app/(auth)/login/page.tsx`

```typescript
'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogoMark } from '@/components/ui/Logo'
import { Shield, ChartBar, Users, ArrowRight, Mail } from 'lucide-react'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--login-page-bg)' }}
    >
      {/* ── MOBILE (< md) ── */}
      <div className="md:hidden w-full max-w-sm px-6 py-12 flex flex-col items-center">
        <MobileLoginContent onGoogleLogin={handleGoogleLogin} />
      </div>

      {/* ── DESKTOP (≥ md) ── */}
      <div
        className="hidden md:grid md:grid-cols-2 w-full max-w-4xl min-h-[560px] rounded-2xl overflow-hidden"
        style={{ border: '1px solid var(--login-border)' }}
      >
        <BrandingPanel />
        <FormPanel onGoogleLogin={handleGoogleLogin} />
      </div>
    </div>
  )
}
```

---

## Component: `MobileLoginContent`

```typescript
function MobileLoginContent({ onGoogleLogin }: { onGoogleLogin: () => void }) {
  return (
    <>
      {/* Logo mark */}
      <div className="mb-5">
        <LogoMark size={56} />
      </div>

      {/* Wordmark */}
      <div className="text-[26px] font-medium tracking-tight mb-1.5">
        <span style={{ color: '#0084DB' }}>Grow</span>
        <span style={{ color: 'var(--login-text-primary)' }}>Base</span>
      </div>

      {/* Tagline */}
      <p
        className="text-[11px] text-center mb-8 tracking-[0.2px]"
        style={{ color: 'var(--login-text-muted)' }}
      >
        nền tảng để tăng trưởng tài chính
      </p>

      {/* Separator */}
      <div className="w-full flex items-center gap-3 mb-4">
        <div className="flex-1 h-px" style={{ background: 'var(--login-border)' }} />
        <span className="text-[11px]" style={{ color: 'var(--login-text-muted)' }}>
          Bắt đầu ngay
        </span>
        <div className="flex-1 h-px" style={{ background: 'var(--login-border)' }} />
      </div>

      {/* Google button */}
      <GoogleButton onClick={onGoogleLogin} fullWidth />

      {/* Email button (secondary) */}
      <button
        className="w-full flex items-center gap-3 px-4 py-[13px] rounded-[10px] mt-2.5 mb-7 transition-opacity hover:opacity-80"
        style={{
          border: '1px solid var(--login-border)',
          background: 'var(--login-form-bg)',
        }}
      >
        <Mail className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--login-text-muted)' }} />
        <span className="text-[12px]" style={{ color: 'var(--login-text-secondary)' }}>
          Tiếp tục với Email
        </span>
      </button>

      <TermsText />
    </>
  )
}
```

---

## Component: `BrandingPanel` (Desktop left)

```typescript
function BrandingPanel() {
  const features = [
    { icon: ChartBar,  text: 'Báo cáo thu chi trực quan' },
    { icon: Shield,    text: 'Quản lý 5 loại quỹ thông minh' },
    { icon: Users,     text: 'Chia sẻ với cả gia đình' },
  ]

  return (
    <div
      className="relative flex flex-col justify-between p-9 overflow-hidden"
      style={{ background: 'var(--login-panel-bg)', borderRight: '1px solid var(--login-border)' }}
    >
      {/* Decorative ascending bars — background */}
      <DecorativeBars />

      <div className="relative z-10">
        {/* Logo + wordmark */}
        <div className="flex items-center gap-2.5 mb-8">
          <LogoMark size={32} />
          <div className="text-[19px] font-medium tracking-tight">
            <span style={{ color: '#0084DB' }}>Grow</span>
            <span style={{ color: 'var(--login-text-primary)' }}>Base</span>
          </div>
        </div>

        {/* Headline */}
        <p
          className="text-[15px] font-medium leading-snug mb-2"
          style={{ color: 'var(--login-text-primary)' }}
        >
          Tài chính rõ ràng,<br />tương lai vững chắc
        </p>
        <p
          className="text-[12px] leading-relaxed mb-7"
          style={{ color: 'var(--login-text-secondary)' }}
        >
          Quản lý chi tiêu, quỹ và đầu tư<br />cho cả gia đình trong một nơi.
        </p>

        {/* Feature list */}
        <div className="flex flex-col gap-3">
          {features.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2.5">
              <div
                className="w-[26px] h-[26px] rounded-[7px] flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(0, 132, 219, 0.12)' }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: '#0084DB' }} />
              </div>
              <span className="text-[12px]" style={{ color: 'var(--login-text-secondary)' }}>
                {text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Free badge */}
      <div className="relative z-10 mt-6">
        <div
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5"
          style={{
            background: 'rgba(0, 132, 219, 0.08)',
            border: '1px solid rgba(0, 132, 219, 0.15)',
          }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-brand" />
          <span className="text-[11px]" style={{ color: 'var(--login-text-secondary)' }}>
            Miễn phí — không cần thẻ tín dụng
          </span>
        </div>
      </div>
    </div>
  )
}
```

---

## Component: `FormPanel` (Desktop right)

```typescript
function FormPanel({ onGoogleLogin }: { onGoogleLogin: () => void }) {
  return (
    <div
      className="flex flex-col justify-center items-center p-9"
      style={{ background: 'var(--login-form-bg)' }}
    >
      <div className="w-full max-w-[260px]">
        <p
          className="text-[16px] font-medium mb-1"
          style={{ color: 'var(--login-text-primary)' }}
        >
          Chào mừng trở lại
        </p>
        <p className="text-[12px] mb-7" style={{ color: 'var(--login-text-muted)' }}>
          Đăng nhập để tiếp tục
        </p>

        {/* Google */}
        <GoogleButton onClick={onGoogleLogin} fullWidth />

        {/* Divider */}
        <div className="flex items-center gap-2 my-3">
          <div className="flex-1 h-px" style={{ background: 'var(--login-border)' }} />
          <span className="text-[11px]" style={{ color: 'var(--login-text-muted)' }}>
            hoặc
          </span>
          <div className="flex-1 h-px" style={{ background: 'var(--login-border)' }} />
        </div>

        {/* Email input */}
        <div
          className="flex items-center gap-2 px-3 py-[11px] rounded-[9px] mb-2.5"
          style={{
            border: '1px solid var(--login-border)',
            background: 'var(--login-input-bg)',
          }}
        >
          <Mail className="w-[14px] h-[14px] flex-shrink-0" style={{ color: 'var(--login-text-muted)' }} />
          <span className="text-[12px]" style={{ color: 'var(--login-text-muted)' }}>
            Email của bạn
          </span>
        </div>

        {/* Continue button */}
        <button
          className="w-full flex items-center justify-center gap-2 px-4 py-[11px] rounded-[9px] mb-5 transition-opacity hover:opacity-80"
          style={{
            border: '1px solid var(--login-border)',
            background: 'rgba(0, 132, 219, 0.04)',
          }}
        >
          <span className="text-[13px]" style={{ color: '#0084DB' }}>
            Tiếp tục
          </span>
          <ArrowRight className="w-[14px] h-[14px]" style={{ color: '#0084DB' }} />
        </button>

        <TermsText />
      </div>
    </div>
  )
}
```

---

## Component: `GoogleButton`

```typescript
function GoogleButton({
  onClick,
  fullWidth = false,
}: {
  onClick: () => void
  fullWidth?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`${fullWidth ? 'w-full' : ''} flex items-center justify-center gap-2.5
        px-4 py-[13px] rounded-[10px] transition-opacity hover:opacity-90 active:scale-[0.98]`}
      style={{ background: '#0084DB' }}
    >
      {/* Google G icon */}
      <span
        className="w-[18px] h-[18px] bg-white rounded-[3px] flex items-center justify-center flex-shrink-0"
      >
        <span className="text-[11px] font-medium leading-none" style={{ color: '#0084DB' }}>
          G
        </span>
      </span>
      <span className="text-[13px] font-medium text-white">
        Tiếp tục với Google
      </span>
    </button>
  )
}
```

---

## Component: `TermsText`

```typescript
function TermsText() {
  return (
    <p
      className="text-[11px] text-center leading-relaxed"
      style={{ color: 'var(--login-text-muted)' }}
    >
      Tiếp tục là đồng ý với{' '}
      <a href="/terms" style={{ color: '#0084DB' }} className="hover:underline">
        Điều khoản dịch vụ
      </a>{' '}
      và{' '}
      <a href="/privacy" style={{ color: '#0084DB' }} className="hover:underline">
        Chính sách bảo mật
      </a>
    </p>
  )
}
```

---

## Component: `DecorativeBars` (SVG background decoration)

```typescript
function DecorativeBars() {
  return (
    <svg
      className="absolute right-[-16px] bottom-[-16px] pointer-events-none"
      width="180" height="220"
      viewBox="0 0 180 220"
      aria-hidden="true"
    >
      <rect x="0"   y="120" width="42" height="100" rx="7" fill="#0084DB" opacity="0.06"/>
      <rect x="52"  y="76"  width="42" height="144" rx="7" fill="#0084DB" opacity="0.06"/>
      <rect x="104" y="20"  width="42" height="200" rx="7" fill="#0084DB" opacity="0.08"/>
      <path
        d="M21 100 L73 58 L125 14"
        stroke="#0084DB" strokeWidth="2"
        strokeDasharray="5 4" strokeLinecap="round"
        fill="none" opacity="0.09"
      />
      <circle cx="125" cy="14" r="7" fill="#0084DB" opacity="0.09"/>
    </svg>
  )
}
```

---

## File: `src/app/auth/callback/route.ts` (nếu chưa có)

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL('/dashboard', request.url))
}
```

---

## Metadata — cập nhật `src/app/(auth)/layout.tsx`

```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Đăng nhập — GrowBase',
  description: 'Đăng nhập vào GrowBase để quản lý tài chính gia đình',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

---

## Dark/Light mode toggle (nếu chưa có)

Cài next-themes để handle dark/light mode:
```bash
npm install next-themes
```

Cập nhật `src/app/providers.tsx`:
```typescript
import { ThemeProvider } from 'next-themes'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
    >
      {/* ... existing providers */}
      {children}
    </ThemeProvider>
  )
}
```

Cập nhật `tailwind.config.ts`:
```typescript
const config = {
  darkMode: 'class',   // ← thêm dòng này
  // ... rest of config
}
```

---

## Acceptance Criteria

- [ ] Mobile: logo + wordmark + tagline + Google button + Email button + terms
- [ ] Desktop: 2-panel (branding trái, form phải) đúng layout
- [ ] Dark mode: background #05101A, text #EFF6FF
- [ ] Light mode: background #F5F9FF, text #05101A
- [ ] Toggle dark/light theo system preference (prefers-color-scheme)
- [ ] Google OAuth redirect đúng về /dashboard sau login
- [ ] Hover states trên buttons hoạt động
- [ ] LogoMark SVG hiển thị đúng ở cả 2 mode
- [ ] DecorativeBars visible nhưng subtle (opacity 6-9%)
- [ ] Font Plus Jakarta Sans đã load cho wordmark
- [ ] Responsive: mobile < 768px, desktop ≥ 768px
- [ ] `npm run build` không lỗi TypeScript