"use client"

import { useTranslation } from "react-i18next"
import { useFormContext } from "react-hook-form"
import { CardContent } from "@/components/ui/card"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import StarRating from "@/components/star-rating"

interface CombinedRatingSectionProps {
  serviceId1: string
  serviceName1: string
  serviceId2: string
  serviceName2: string
  sectionTitle?: string
}

export default function CombinedRatingSection({
  serviceId1,
  serviceName1,
  serviceId2,
  serviceName2,
  sectionTitle,
}: CombinedRatingSectionProps) {
  const { t } = useTranslation()
  const { control } = useFormContext()

  return (
    <CardContent className="space-y-8 p-6">
      <div className="grid gap-8 md:gap-12">
        {/* First Rating Section */}
        <div className="space-y-4">
          <FormField
            control={control}
            name={`services.${serviceId1}.rating`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-medium text-primary">{serviceName1}</FormLabel>
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
            name={`services.${serviceId1}.comment`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base text-muted-foreground">{t("serviceRating.comments")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t("serviceRating.commentsPlaceholder")}
                    className="resize-none min-h-[80px] text-base border-muted-foreground/20 focus:border-primary"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-base" />
              </FormItem>
            )}
          />
        </div>

        {/* Second Rating Section */}
        <div className="space-y-4">
          <FormField
            control={control}
            name={`services.${serviceId2}.rating`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-medium text-primary">{serviceName2}</FormLabel>
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
            name={`services.${serviceId2}.comment`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base text-muted-foreground">{t("serviceRating.comments")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t("serviceRating.commentsPlaceholder")}
                    className="resize-none min-h-[80px] text-base border-muted-foreground/20 focus:border-primary"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-base" />
              </FormItem>
            )}
          />
        </div>
      </div>
    </CardContent>
  )
}
