import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
    "../../packages/shared/src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-jakarta)", "Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "'SF Mono'", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: "hsl(var(--surface))",
        elevated: "hsl(var(--elevated))",
        inset: "hsl(var(--inset))",
        faint: "hsl(var(--faint))",
        ink: "hsl(var(--ink))",
        violet: "hsl(var(--violet))",
        "light-primary": "var(--light-primary)",
        "light-primary-pressed": "var(--light-primary-pressed)",
        brand: {
          DEFAULT: "#0084DB",
          hover: "#006BB8",
          pressed: "#004F8A",
          tint: "#EBF5FF",
        },
        income: "hsl(var(--success))",
        expense: "hsl(var(--error))",
        error: "hsl(var(--error))",
        success: {
          DEFAULT: "hsl(var(--success))",
          soft: "hsl(var(--success-soft))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          soft: "hsl(var(--warning-soft))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          soft: "hsl(var(--info-soft))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          hover: "hsl(var(--primary-hover))",
          pressed: "hsl(var(--primary-pressed))",
          foreground: "hsl(var(--primary-foreground))",
          soft: "hsl(var(--primary-soft))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        "3xl": "calc(var(--radius) + 6px)",
        "2xl": "calc(var(--radius) + 4px)",
        xl: "calc(var(--radius) + 2px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        // "card": "rgba(37, 83, 185, 0.1) 0px 2px 6px",
        "card": "rgba(37, 83, 185, 0.1) 0px 2px 6px 0px",
        "card-hover": "rgba(29, 77, 124, 0.14) 0px 4px 12px",
        "soft-xs": "none",
        "soft-sm": "none",
        "soft": "none",
        "soft-md": "none",
        "soft-lg": "none",
        "float": "0 8px 18px rgba(0, 132, 219, 0.26)",
        "panel": "rgba(29, 77, 124, 0.08) 0px 2px 6px",
        "panel-hover": "none",
        "sidebar": "none",
        "topbar": "rgba(29, 77, 124, 0.08) 0px 2px 6px",
        "button": "rgba(0, 133, 219, 0.3) 0px 4px 12px 0px"
      },
      spacing: {
        "sidebar": "var(--sidebar-width)",
        "topbar": "var(--topbar-height)",
        "page-gap": "var(--page-gap)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "growth-bar": {
          from: { transform: "scaleY(0)" },
          to: { transform: "scaleY(1)" },
        },
        "page-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        shimmer: {
          "0%, 100%": { backgroundPosition: "-200% 0" },
          "50%": { backgroundPosition: "200% 0" },
        },
        "dropdown-in": {
          from: { opacity: "0", transform: "translateY(-4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "modal-in": {
          from: { opacity: "0", transform: "scale(0.9)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "growth-bar": "growth-bar 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "page-in": "page-in 360ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 180ms ease both",
        shimmer: "shimmer 1500ms linear infinite",
        "dropdown-in": "dropdown-in 250ms cubic-bezier(0.4,0,0.2,1)",
        "modal-in": "modal-in 250ms cubic-bezier(0.4,0,0.2,1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
