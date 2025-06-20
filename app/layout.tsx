import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { I18nProvider } from "@/components/i18n-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Premium Hotel Service Rating",
  description: "Rate your hotel experience with our premium service rating platform",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gradient-to-b from-background to-muted/30`}>
        <I18nProvider>
          <div className="min-h-screen flex flex-col">{children}</div>
        </I18nProvider>
      </body>
    </html>
  )
}
