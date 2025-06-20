"use client"

import { useTranslation } from "react-i18next"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { motion } from "framer-motion"

export default function LanguageSelector() {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const languages = [
    {
      code: "en",
      name: "English",
    },
    {
      code: "fr",
      name: "Français",
    },
    {
      code: "de",
      name: "Deutsch",
    },
  ]

  const handleLanguageSelect = (langCode: string) => {
    setIsLoading(langCode)
    i18n.changeLanguage(langCode).then(() => {
      // Redirect to lottery page instead of rating page
      router.push(`/${langCode}/lottery`)
    })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="premium-card overflow-hidden">
          <div className="h-2 premium-gradient-bg w-full"></div>
          <CardHeader className="text-center space-y-4 pb-4">
            <CardTitle className="text-3xl font-bold text-primary">{t("languageSelector.title")}</CardTitle>
            <CardDescription className="text-lg px-4">{t("languageSelector.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 p-6">
            {languages.map((lang) => (
              <Button
                key={lang.code}
                variant="outline"
                className="flex justify-between items-center h-16 text-xl premium-border hover:border-primary hover:bg-primary/5 transition-all"
                onClick={() => handleLanguageSelect(lang.code)}
                disabled={isLoading !== null}
              >
                <span className="flex items-center gap-3">
                  <span>{lang.name}</span>
                </span>
                {isLoading === lang.code && <Loader2 className="h-5 w-5 animate-spin" />}
              </Button>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
