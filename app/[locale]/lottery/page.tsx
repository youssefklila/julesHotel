"use client"

import { useTranslation } from "react-i18next"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Gift, Star, Calendar, Users, ArrowRight, Home, Sparkles } from "lucide-react"
import { motion } from "framer-motion"

export default function LotteryPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  const handleParticipate = () => {
    router.push(`/${locale}/rating`)
  }

  const handleHome = () => {
    router.push("/")
  }

  return (
    <main className="min-h-screen p-4 md:p-8 flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30">
      {/* Home Button */}
      <div className="fixed top-4 left-4 z-10">
        <Button variant="ghost" size="icon" onClick={handleHome} className="rounded-full">
          <Home className="h-5 w-5" />
          <span className="sr-only">{t("common.home")}</span>
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-4xl"
      >
        <Card className="premium-card overflow-hidden border-2 border-blue-200 shadow-2xl">
          {/* Gradient Header */}
          <div className="h-3 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 w-full"></div>

          <CardHeader className="text-center space-y-6 pb-4 bg-gradient-to-b from-blue-50 to-white">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="flex justify-center"
            >
              <div className="relative">
                <Gift className="h-20 w-20 text-blue-600" />
                <Sparkles className="h-8 w-8 text-blue-500 absolute -top-2 -right-2 animate-pulse" />
              </div>
            </motion.div>

            <div className="space-y-2">
              <CardTitle className="text-3xl md:text-4xl font-bold text-blue-800">{t("lottery.title")}</CardTitle>
              <CardDescription className="text-xl text-blue-700 font-medium">{t("lottery.subtitle")}</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-8 p-6 md:p-8">
            {/* Features Grid */}
            {/* Information Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-6"
            >
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800">
                <p className="text-base">{t("lottery.infoMessage")}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid md:grid-cols-2 gap-8"
            >
              {/* What You Can Win */}
              <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl text-blue-800 flex items-center gap-2">
                    <Star className="h-6 w-6 text-blue-600" />
                    {t("lottery.features.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-700">
                    <Users className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <span>{t("lottery.features.stay")}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <Gift className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <span>{t("lottery.features.meals")}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <Sparkles className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <span>{t("lottery.features.location")}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-blue-700 bg-blue-100 p-2 rounded">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium">{t("lottery.features.note")}</span>
                  </div>
                </CardContent>
              </Card>

              {/* How It Works */}
              <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl text-blue-800 flex items-center gap-2">
                    <ArrowRight className="h-6 w-6 text-blue-600" />
                    {t("lottery.terms.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                        1
                      </div>
                      <span className="text-gray-700">{t("lottery.terms.step1")}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                        2
                      </div>
                      <span className="text-gray-700">{t("lottery.terms.step2")}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                        3
                      </div>
                      <span className="text-gray-700">{t("lottery.terms.step3")}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                        4
                      </div>
                      <span className="text-gray-700">{t("lottery.terms.step4")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex justify-center pt-4"
            >
              <Button
                onClick={handleParticipate}
                className="h-14 px-8 text-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                size="lg"
              >
                <Gift className="mr-3 h-6 w-6" />
                {t("lottery.buttons.participate")}
              </Button>
            </motion.div>

            {/* Disclaimer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-center"
            >
              <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border">{t("lottery.disclaimer")}</p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  )
}
