"use client"

import { useTranslation } from "react-i18next"
import { useFormContext } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export default function OverallRatingSection() {
  const { t } = useTranslation()
  const { control } = useFormContext()

  return (
    <FormField
      control={control}
      name="overallRating"
      render={({ field }) => (
        <FormItem className="space-y-3">
          <FormLabel className="text-base">{t("additionalQuestions.overallRating")}</FormLabel>
          <FormDescription className="text-sm">{t("additionalQuestions.overallRatingDescription")}</FormDescription>
          <FormControl>
            <RadioGroup
              onValueChange={(value) => field.onChange(Number.parseInt(value))}
              value={field.value?.toString()}
              className="flex flex-wrap gap-2"
            >
              {Array.from({ length: 11 }, (_, i) => (
                <div key={i} className="flex flex-col items-center">
                  <RadioGroupItem value={i.toString()} id={`rating-${i}`} className="peer sr-only" />
                  <Label
                    htmlFor={`rating-${i}`}
                    className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-md border-2 border-primary/20 bg-transparent peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground text-lg font-medium"
                  >
                    {i}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </FormControl>
          <FormMessage className="text-base" />
        </FormItem>
      )}
    />
  )
}
