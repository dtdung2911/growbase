import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import { Providers } from "./providers"
// Trước globals.css để override .driver-popover (tour onboarding) thắng theo source order.
import "driver.js/dist/driver.css"
import "./globals.css"

// Self-hosted (next/font/local): build không cần fetch fonts.gstatic.com —
// prod self-host build offline được. Variable TTF phủ đủ glyph latin + vietnamese.
const jakarta = localFont({
  src: "./fonts/PlusJakartaSans.woff2",
  weight: "200 800",
  variable: "--font-jakarta",
  display: "swap",
})

const jetbrains = localFont({
  src: "./fonts/JetBrainsMono.woff2",
  weight: "100 800",
  variable: "--font-jetbrains",
  display: "swap",
})

export const metadata: Metadata = {
  title: "GrowBase",
  description: "Quản lý tài chính gia đình",
  applicationName: "GrowBase",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/brand/icon-app-light.svg", type: "image/svg+xml" }],
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" className={`${jakarta.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
