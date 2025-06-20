"use client"

import { useTranslation } from "react-i18next"
import { useFormContext } from "react-hook-form"
import { CardContent } from "@/components/ui/card"
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

export default function UserInfoSection() {
  const { t } = useTranslation()
  const { control } = useFormContext()

  // List of nationalities
  const nationalities = [
    "British",
    "French",
    "German",
    "American",
    "Spanish",
    "Italian",
    "Dutch",
    "Belgian",
    "Swiss",
    "Austrian",
    "Russian",
    "Chinese",
    "Japanese",
    "Australian",
    "Canadian",
    "Other",
  ]

  return (
    <CardContent className="space-y-6 p-6">
      <FormField
        control={control}
        name="fullName"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base">{t("userInfo.fullName")}</FormLabel>
            <FormDescription className="text-sm text-muted-foreground">{t("userInfo.optionalField")}</FormDescription>
            <FormControl>
              <Input placeholder={t("userInfo.fullNamePlaceholder")} {...field} className="h-12 text-lg" />
            </FormControl>
            <FormMessage className="text-base" />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="nationality"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base">{t("userInfo.nationality")}</FormLabel>
            <FormDescription className="text-sm text-muted-foreground">{t("userInfo.optionalField")}</FormDescription>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="h-12 text-lg">
                  <SelectValue placeholder={t("userInfo.nationalityPlaceholder")} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {nationalities.map((nationality) => (
                  <SelectItem key={nationality} value={nationality} className="text-base">
                    {nationality}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage className="text-base" />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="age"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base">{t("userInfo.age")}</FormLabel>
            <FormDescription className="text-sm text-muted-foreground">{t("userInfo.optionalField")}</FormDescription>
            <FormControl>
              <Input
                type="number"
                placeholder={t("userInfo.agePlaceholder")}
                value={field.value === undefined ? "" : field.value}
                onChange={(e) => field.onChange(e.target.value ? Number.parseInt(e.target.value) : "")}
                className="h-12 text-lg"
              />
            </FormControl>
            <FormMessage className="text-base" />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="tourOperator"
        render={() => (
          <FormItem>
            <FormLabel className="text-base">{t("userInfo.tourOperator")}</FormLabel>
            <div className="space-y-2">
              <FormField
                control={control}
                name="tourOperator.travelAgency"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-base">{t("userInfo.tourOperatorOptions.travelAgency")}</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="tourOperator.onlineWebsite"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-base">{t("userInfo.tourOperatorOptions.onlineWebsite")}</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="tourOperator.directHotel"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-base">{t("userInfo.tourOperatorOptions.directHotel")}</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            <FormMessage className="text-base" />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="roomNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base">{t("userInfo.roomNumber")}</FormLabel>
            <FormDescription className="text-sm text-muted-foreground">{t("userInfo.optionalField")}</FormDescription>
            <FormControl>
              <Input placeholder={t("userInfo.roomNumberPlaceholder")} {...field} className="h-12 text-lg" />
            </FormControl>
            <FormMessage className="text-base" />
          </FormItem>
        )}
      />
    </CardContent>
  )
}
