import * as z from "zod"
import type { TFunction } from "i18next"

export const createRatingSchema = (t: TFunction) => {
  return z.object({
    fullName: z.string().optional(),
    nationality: z.string().optional(),
    age: z.union([
      z.string().optional(),
      z
        .number()
        .min(18, { message: t("validation.ageMin") })
        .max(120, { message: t("validation.ageMax") })
        .optional(),
      z.string().transform((val, ctx) => {
        if (!val) return undefined;
        const parsed = Number.parseInt(val)
        if (isNaN(parsed)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("validation.ageInvalid"),
          })
          return z.NEVER
        }
        return parsed
      }).optional(),
    ]).optional(),
    tourOperator: z
      .object({
        travelAgency: z.boolean().optional(),
        onlineWebsite: z.boolean().optional(),
        directHotel: z.boolean().optional(),
      })
      .refine((data) => data.travelAgency || data.onlineWebsite || data.directHotel, {
        message: t("validation.tourOperatorRequired"),
      }),
    roomNumber: z.string().optional(),
    recommend: z.union([
      z.null(),
      z.boolean({
        required_error: t("validation.recommendRequired"),
        invalid_type_error: t("validation.recommendInvalid"),
      }),
    ]),
    visitAgain: z.union([
      z.null(),
      z.boolean({
        required_error: t("validation.visitAgainRequired"),
        invalid_type_error: t("validation.visitAgainInvalid"),
      }),
    ]),
    overallRating: z
      .number({
        required_error: t("validation.overallRatingRequired"),
      })
      .min(0)
      .max(10),
    suggestions: z.string().optional(),
    services: z.object({
      reception: z.object({
        rating: z
          .number()
          .min(1, { message: t("validation.ratingRequired") })
          .max(5),
        comment: z.string().optional(),
      }),
      roomQuality: z.object({
        rating: z
          .number()
          .min(1, { message: t("validation.ratingRequired") })
          .max(5),
        comment: z.string().optional(),
      }),
      roomComfort: z.object({
        rating: z
          .number()
          .min(1, { message: t("validation.ratingRequired") })
          .max(5),
        comment: z.string().optional(),
      }),
      restaurantMainService: z.object({
        rating: z
          .number()
          .min(1, { message: t("validation.ratingRequired") })
          .max(5),
        comment: z.string().optional(),
      }),
      restaurantMainQuality: z.object({
        rating: z
          .number()
          .min(1, { message: t("validation.ratingRequired") })
          .max(5),
        comment: z.string().optional(),
      }),
      restaurantBarbecueService: z.object({
        rating: z
          .number()
          .min(1, { message: t("validation.ratingRequired") })
          .max(5),
        comment: z.string().optional(),
      }),
      restaurantBarbecueQuality: z.object({
        rating: z
          .number()
          .min(1, { message: t("validation.ratingRequired") })
          .max(5),
        comment: z.string().optional(),
      }),
      restaurantInternationalService: z.object({
        rating: z
          .number()
          .min(1, { message: t("validation.ratingRequired") })
          .max(5),
        comment: z.string().optional(),
      }),
      restaurantInternationalQuality: z.object({
        rating: z
          .number()
          .min(1, { message: t("validation.ratingRequired") })
          .max(5),
        comment: z.string().optional(),
      }),
      animationDay: z.object({
        rating: z
          .number()
          .min(1, { message: t("validation.ratingRequired") })
          .max(5),
        comment: z.string().optional(),
      }),
      animationEvening: z.object({
        rating: z
          .number()
          .min(1, { message: t("validation.ratingRequired") })
          .max(5),
        comment: z.string().optional(),
      }),
      bar: z.object({
        rating: z
          .number()
          .min(1, { message: t("validation.ratingRequired") })
          .max(5),
        comment: z.string().optional(),
      }),
      pool: z.object({
        rating: z
          .number()
          .min(1, { message: t("validation.ratingRequired") })
          .max(5),
        comment: z.string().optional(),
      }),
      spa: z.object({
        rating: z
          .number()
          .min(1, { message: t("validation.ratingRequired") })
          .max(5),
        comment: z.string().optional(),
      }),
      cleanliness: z.object({
        rating: z
          .number()
          .min(1, { message: t("validation.ratingRequired") })
          .max(5),
        comment: z.string().optional(),
      }),
    }),
  })
}
