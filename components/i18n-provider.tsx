"use client"

import { type ReactNode, useEffect } from "react"
import i18n from "i18next"
import { initReactI18next, I18nextProvider } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { usePathname, useRouter } from "next/navigation"

// Import translations
import enTranslation from "@/locales/en.json"
import frTranslation from "@/locales/fr.json"
import deTranslation from "@/locales/de.json"

// Initialize i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      fr: { translation: frTranslation },
      de: { translation: deTranslation },
    },
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["path", "localStorage", "navigator"],
    },
  })

export function I18nProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Extract locale from path if present
    const pathLocale = pathname.split("/")[1]
    if (["en", "fr", "de"].includes(pathLocale)) {
      i18n.changeLanguage(pathLocale)
    }
  }, [pathname])

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
