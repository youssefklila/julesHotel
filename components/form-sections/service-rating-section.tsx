"use client"

import { useTranslation } from "react-i18next"
import { useFormContext } from "react-hook-form"
import { CardContent } from "@/components/ui/card"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import StarRating from "@/components/star-rating"

interface ServiceRatingSectionProps {
  serviceId: string
  serviceName: string
}

export default function ServiceRatingSection({ serviceId, serviceName }: ServiceRatingSectionProps) {
  const { t } = useTranslation()
  const { control } = useFormContext()

  return (
    <CardContent className="space-y-6 p-6">
      <FormField
        control={control}
        name={`services.${serviceId}.rating`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-lg font-medium text-primary">{t("serviceRating.rateService")}</FormLabel>
            <FormControl>
              <div className="py-2">
                <StarRating rating={field.value} onRatingChange={field.onChange} />
              </div>
            </FormControl>
            <FormMessage className="text-base" />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={`services.${serviceId}.comment`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base text-muted-foreground">{t("serviceRating.comments")}</FormLabel>
            <FormControl>
              <Textarea
                placeholder={t("serviceRating.commentsPlaceholder")}
                className="resize-none min-h-[120px] text-base border-muted-foreground/20 focus:border-primary"
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
