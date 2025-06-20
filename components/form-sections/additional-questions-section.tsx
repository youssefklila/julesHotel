"use client"

import { useTranslation } from "react-i18next"
import { useFormContext } from "react-hook-form"
import { CardContent } from "@/components/ui/card"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import OverallRatingSection from "./overall-rating-section"

export default function AdditionalQuestionsSection() {
  const { t } = useTranslation()
  const { control } = useFormContext()

  return (
    <CardContent className="space-y-6 p-6">
      <FormField
        control={control}
        name="recommend"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel className="text-base">{t("additionalQuestions.recommend")}</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={(value) => field.onChange(value === "true")}
                value={field.value === null ? undefined : String(field.value)}
                className="flex flex-col space-y-3"
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="true" id="recommend-yes" className="h-6 w-6" />
                  <Label htmlFor="recommend-yes" className="text-lg">
                    {t("common.yes")}
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="false" id="recommend-no" className="h-6 w-6" />
                  <Label htmlFor="recommend-no" className="text-lg">
                    {t("common.no")}
                  </Label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage className="text-base" />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="visitAgain"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel className="text-base">{t("additionalQuestions.visitAgain")}</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={(value) => field.onChange(value === "true")}
                value={field.value === null ? undefined : String(field.value)}
                className="flex flex-col space-y-3"
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="true" id="visit-again-yes" className="h-6 w-6" />
                  <Label htmlFor="visit-again-yes" className="text-lg">
                    {t("common.yes")}
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="false" id="visit-again-no" className="h-6 w-6" />
                  <Label htmlFor="visit-again-no" className="text-lg">
                    {t("common.no")}
                  </Label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage className="text-base" />
          </FormItem>
        )}
      />

      <OverallRatingSection />

      <FormField
        control={control}
        name="suggestions"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base">{t("additionalQuestions.suggestions")}</FormLabel>
            <FormControl>
              <Textarea
                placeholder={t("additionalQuestions.suggestionsPlaceholder")}
                className="resize-none min-h-[150px] text-lg"
                {...field}
              />
            </FormControl>
            <FormMessage className="text-base" />
          </FormItem>
        )}
      />
    </CardContent>
  )
}
