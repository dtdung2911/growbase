"use client"

import { useState } from "react"
import { Icon } from "@iconify/react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { LogoMark } from "@/components/ui/Logo"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { BrandLogo } from "@/components/brand/BrandLogo";
import ChartLineUpDuotoneIcon from "@iconify-react/ph/chart-line-up-duotone";
import CardholderDuotoneIcon from "@iconify-react/ph/cardholder-duotone";
import UserCirclePlusDuotoneIcon from "@iconify-react/ph/user-circle-plus-duotone";

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
    <div className="min-h-screen flex items-center justify-center border-primary bg-light-primary">
      {/* Mobile (< md) */}
      <div className="md:hidden w-full max-w-sm px-6 py-12 flex flex-col items-center">
        <MobileLoginContent
          onGoogleLogin={handleGoogleLogin}
          loading={loading}
        />
      </div>

      {/* Desktop (≥ md) */}
      <div className="hidden md:grid md:grid-cols-2 w-full max-w-4xl min-h-[560px] rounded-2xl overflow-hidden login-card shadow-card border-primary">
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
      <div className="flex items-center gap-2.5">
        <img
          src="/images/card-2.png"
          alt=""
          className="pointer-events-none absolute -right-3 top-0 w-28object-contain"
          aria-hidden="true"
        />
        <BrandLogo
          variant="vertical"
          imageStyleName={{
            width: "32rem",
            marginTop: "12rem",
            "max-width": "50rem",
          }}
        />
      </div>

      <GoogleButton onClick={onGoogleLogin} loading={loading} fullWidth />
      <TermsText />
    </>
  );
}

function BrandingPanel() {
  const { t } = useTranslation()

  const features = [
    { icon: "lucide:bar-chart-3", textKey: "login.feature1" },
    { icon: "lucide:shield", textKey: "login.feature2" },
    { icon: "lucide:users", textKey: "login.feature3" },
  ]

  return (
    <div className="relative flex flex-col justify-between p-9 overflow-hidden bg-gradient-to-br from-primary to-primary-hover text-white shadow-card shadow-card-hover border-primary">
      <img
        src="/images/card-2.png"
        alt=""
        className="pointer-events-none absolute -right-3 -top-1 w-28 h-32 object-contain"
        aria-hidden="true"
      />
      <div className="relative z-10">
        <div className="flex items-center gap-2.5">
          <BrandLogo variant="white" imageClassName="h-14 w-168" />
        </div>

        <p className="text-[12px]  leading-snug mb-2 whitespace-pre-line">
          {t("login.headline")}
        </p>
        <div className="flex flex-col gap-8 mt-32">
          {features.map(({ icon, textKey }) => (
            <div key={textKey} className="flex items-center gap-2.5">
              <div className="w-[26px] h-[26px] rounded-[7px] flex items-center justify-center flex-shrink-0 bg-primary/[0.12]">
                {textKey === "login.feature1" ? (
                  <ChartLineUpDuotoneIcon height="3em" />
                ) : textKey === "login.feature2" ? (
                  <CardholderDuotoneIcon height="3em" />
                ) : (
                  textKey === "login.feature3" && (
                    <UserCirclePlusDuotoneIcon height="3em" />
                  )
                )}
              </div>
              <span className="text-[15px]">{t(textKey)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 mt-6">
        <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 bg-primary border border-primary">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-[11px]">{t("login.freeBadge")}</span>
        </div>
      </div>
    </div>
  );
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
      <DecorativeBars />
      <div className="w-full max-w-[260px]">
        <p
          className="text-[16px] font-medium mb-1"
          style={{ color: "var(--login-text-primary)" }}
        >
          {t("login.welcomeBack")}
        </p>
        <p
          className="text-[12px] mb-7"
          style={{ color: "var(--login-text-muted)" }}
        >
          {t("login.signInToContinue")}
        </p>

        <GoogleButton onClick={onGoogleLogin} loading={loading} fullWidth />

        <TermsText />
      </div>
    </div>
  );
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
      className={`${fullWidth ? "w-full" : ""} mt-36 flex items-center justify-center gap-2.5 px-4 py-[13px] rounded-[10px] transition-opacity hover:opacity-90 hover:scale-[0.98] disabled:opacity-60 bg-primary`}
    >
      {loading ? (
        <Icon
          icon="lucide:loader-2"
          className="w-[18px] h-[18px] text-white animate-spin"
        />
      ) : (
        <span className="w-[18px] h-[18px] bg-white rounded-[3px] flex items-center justify-center flex-shrink-0">
          <span className="text-[11px] font-medium leading-none text-primary">
            G
          </span>
        </span>
      )}
      <span className="text-[13px] font-medium text-white">
        {t("login.googleButton")}
      </span>
    </button>
  );
}

function TermsText() {
  const { t } = useTranslation()

  return (
    <p
      className="text-[12px] text-center leading-relaxed mt-6"
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
  );
}

function DecorativeBars() {
  return (
    <img
      src="/brand/icon-mark.svg"
      alt=""
      className="pointer-events-none absolute -right-1 -bottom-6  opacity-5 object-contain"
      style={{ width: "322px" }}
      aria-hidden="true"
    />
  );
}
