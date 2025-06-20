"use client"

import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { CheckCircle, Home } from "lucide-react"
import { motion } from "framer-motion"

export default function ThankYouPage() {
  const { t } = useTranslation()
  const router = useRouter()

  return (
    <main className="min-h-screen p-4 md:p-8 flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="premium-card overflow-hidden">
          <div className="h-2 premium-gradient-bg w-full"></div>
          <CardHeader className="text-center space-y-4 pb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="flex justify-center"
            >
              <CheckCircle className="h-24 w-24 text-green-500" />
            </motion.div>
            <CardTitle className="text-3xl text-primary">{t("thankYou.title")}</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6 p-6">
            <p className="text-lg">{t("thankYou.message")}</p>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  )
}
