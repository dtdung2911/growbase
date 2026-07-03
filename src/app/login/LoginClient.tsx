"use client"

import { useState } from "react"
import { Icon } from "@iconify/react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { LogoMark } from "@/components/ui/Logo"
import { useTranslation } from "@/lib/i18n/useTranslation"

export function LoginClient() {
  const supabase = createClient()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setLoading(false)
      toast.error(t("login.failed"), { duration: 5000 })
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--login-page-bg)" }}
    >
      {/* Mobile (< md) */}
      <div className="md:hidden w-full max-w-sm px-6 py-12 flex flex-col items-center">
        <MobileLoginContent
          onGoogleLogin={handleGoogleLogin}
          loading={loading}
        />
      </div>

      {/* Desktop (≥ md) */}
      <div className="hidden md:grid md:grid-cols-2 w-full max-w-4xl min-h-[560px] rounded-2xl overflow-hidden login-card">
        <BrandingPanel />
        <FormPanel onGoogleLogin={handleGoogleLogin} loading={loading} />
      </div>
    </div>
  );
}

function MobileLoginContent({
  onGoogleLogin,
  loading,
}: {
  onGoogleLogin: () => void
  loading: boolean
}) {
  const { t } = useTranslation()

  return (
    <>
      <div className="mb-5">
        <LogoMark size={56} />
      </div>

      <div className="text-[26px] font-medium tracking-tight mb-1.5">
        <span className="text-primary">Grow</span>
        <span style={{ color: "var(--login-text-primary)" }}>Base</span>
      </div>

      <p
        className="text-[11px] text-center mb-8 tracking-[0.2px]"
        style={{ color: "var(--login-text-muted)" }}
      >
        {t("login.tagline")}
      </p>

      <div className="w-full flex items-center gap-3 mb-4">
        <div className="flex-1 h-px" style={{ background: "var(--login-border)" }} />
        <span className="text-[11px]" style={{ color: "var(--login-text-muted)" }}>
          {t("login.startNow")}
        </span>
        <div className="flex-1 h-px" style={{ background: "var(--login-border)" }} />
      </div>

      <GoogleButton onClick={onGoogleLogin} loading={loading} fullWidth />

      <button
        className="w-full flex items-center gap-3 px-4 py-[13px] rounded-[10px] mt-2.5 mb-7 transition-opacity hover:opacity-80"
        style={{
          border: "1px solid var(--login-border)",
          background: "var(--login-form-bg)",
        }}
      >
        <Icon
          icon="lucide:mail"
          className="w-4 h-4 flex-shrink-0"
          style={{ color: "var(--login-text-muted)" }}
        />
        <span className="text-[12px]" style={{ color: "var(--login-text-secondary)" }}>
          {t("login.emailButton")}
        </span>
      </button>

      <TermsText />
    </>
  )
}

function BrandingPanel() {
  const { t } = useTranslation()

  const features = [
    { icon: "lucide:bar-chart-3", textKey: "login.feature1" },
    { icon: "lucide:shield", textKey: "login.feature2" },
    { icon: "lucide:users", textKey: "login.feature3" },
  ]

  return (
    <div
      className="relative flex flex-col justify-between p-9 overflow-hidden"
      style={{
        background: "var(--login-panel-bg)",
        borderRight: "1px solid var(--login-border)",
      }}
    >
      <DecorativeBars />

      <div className="relative z-10">
        <div className="flex items-center gap-2.5 mb-8">
          <LogoMark size={32} />
          <div className="text-[19px] font-medium tracking-tight">
            <span className="text-primary">Grow</span>
            <span style={{ color: "var(--login-text-primary)" }}>Base</span>
          </div>
        </div>

        <p
          className="text-[15px] font-medium leading-snug mb-2 whitespace-pre-line"
          style={{ color: "var(--login-text-primary)" }}
        >
          {t("login.headline")}
        </p>
        <p
          className="text-[12px] leading-relaxed mb-7 whitespace-pre-line"
          style={{ color: "var(--login-text-secondary)" }}
        >
          {t("login.subheadline")}
        </p>

        <div className="flex flex-col gap-3">
          {features.map(({ icon, textKey }) => (
            <div key={textKey} className="flex items-center gap-2.5">
              <div className="w-[26px] h-[26px] rounded-[7px] flex items-center justify-center flex-shrink-0 bg-primary/[0.12]">
                <Icon icon={icon} className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-[12px]" style={{ color: "var(--login-text-secondary)" }}>
                {t(textKey)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 mt-6">
        <div
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 bg-primary/[0.08] border border-primary/[0.15]"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-[11px]" style={{ color: "var(--login-text-secondary)" }}>
            {t("login.freeBadge")}
          </span>
        </div>
      </div>
    </div>
  )
}

function FormPanel({
  onGoogleLogin,
  loading,
}: {
  onGoogleLogin: () => void
  loading: boolean
}) {
  const { t } = useTranslation()

  return (
    <div
      className="flex flex-col justify-center items-center p-9"
      style={{ background: "var(--login-form-bg)" }}
    >
      <div className="w-full max-w-[260px]">
        <p
          className="text-[16px] font-medium mb-1"
          style={{ color: "var(--login-text-primary)" }}
        >
          {t("login.welcomeBack")}
        </p>
        <p className="text-[12px] mb-7" style={{ color: "var(--login-text-muted)" }}>
          {t("login.signInToContinue")}
        </p>

        <GoogleButton onClick={onGoogleLogin} loading={loading} fullWidth />

        <div className="flex items-center gap-2 my-3">
          <div className="flex-1 h-px" style={{ background: "var(--login-border)" }} />
          <span className="text-[11px]" style={{ color: "var(--login-text-muted)" }}>
            {t("login.or")}
          </span>
          <div className="flex-1 h-px" style={{ background: "var(--login-border)" }} />
        </div>

        <div
          className="flex items-center gap-2 px-3 py-[11px] rounded-[9px] mb-2.5"
          style={{
            border: "1px solid var(--login-border)",
            background: "var(--login-input-bg)",
          }}
        >
          <Icon
            icon="lucide:mail"
            className="w-[14px] h-[14px] flex-shrink-0"
            style={{ color: "var(--login-text-muted)" }}
          />
          <span className="text-[12px]" style={{ color: "var(--login-text-muted)" }}>
            {t("login.emailPlaceholder")}
          </span>
        </div>

        <button
          className="w-full flex items-center justify-center gap-2 px-4 py-[11px] rounded-[9px] mb-5 transition-opacity hover:opacity-80 bg-primary/[0.04]"
          style={{ border: "1px solid var(--login-border)" }}
        >
          <span className="text-[13px] text-primary">
            {t("login.continue")}
          </span>
          <Icon
            icon="lucide:arrow-right"
            className="w-[14px] h-[14px] text-primary"
          />
        </button>

        <TermsText />
      </div>
    </div>
  )
}

function GoogleButton({
  onClick,
  loading,
  fullWidth = false,
}: {
  onClick: () => void
  loading: boolean
  fullWidth?: boolean
}) {
  const { t } = useTranslation()

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`${fullWidth ? "w-full" : ""} flex items-center justify-center gap-2.5 px-4 py-[13px] rounded-[10px] transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-60 bg-primary`}
    >
      {loading ? (
        <Icon icon="lucide:loader-2" className="w-[18px] h-[18px] text-white animate-spin" />
      ) : (
        <span className="w-[18px] h-[18px] bg-white rounded-[3px] flex items-center justify-center flex-shrink-0">
          <span className="text-[11px] font-medium leading-none text-primary">
            G
          </span>
        </span>
      )}
      <span className="text-[13px] font-medium text-white">{t("login.googleButton")}</span>
    </button>
  )
}

function TermsText() {
  const { t } = useTranslation()

  return (
    <p
      className="text-[11px] text-center leading-relaxed"
      style={{ color: "var(--login-text-muted)" }}
    >
      {t("login.terms")}{" "}
      <a href="/terms" className="text-primary hover:underline">
        {t("login.termsOfService")}
      </a>{" "}
      {t("login.and")}{" "}
      <a href="/privacy" className="text-primary hover:underline">
        {t("login.privacyPolicy")}
      </a>
    </p>
  )
}

function DecorativeBars() {
  return (
    <svg
      className="absolute right-[-16px] bottom-[-16px] pointer-events-none"
      width="180"
      height="220"
      viewBox="0 0 180 220"
      aria-hidden="true"
    >
      <rect x="0" y="120" width="42" height="100" rx="7" className="fill-primary" opacity="0.06" />
      <rect x="52" y="76" width="42" height="144" rx="7" className="fill-primary" opacity="0.06" />
      <rect x="104" y="20" width="42" height="200" rx="7" className="fill-primary" opacity="0.08" />
      <path
        d="M21 100 L73 58 L125 14"
        className="stroke-primary"
        strokeWidth="2"
        strokeDasharray="5 4"
        strokeLinecap="round"
        fill="none"
        opacity="0.09"
      />
      <circle cx="125" cy="14" r="7" className="fill-primary" opacity="0.09" />
    </svg>
  )
}
