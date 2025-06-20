"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useRouter } from "next/navigation"
import { useForm, FormProvider, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type * as z from "zod"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, ArrowRight, Send, Home } from "lucide-react"
import UserInfoSection from "./form-sections/user-info-section"
import ServiceRatingSection from "./form-sections/service-rating-section"
import CombinedRatingSection from "./form-sections/combined-rating-section"
import AdditionalQuestionsSection from "./form-sections/additional-questions-section"
import { createRatingSchema } from "@/lib/validation"
import { Progress } from "@/components/ui/progress"
import { motion, AnimatePresence } from "framer-motion"

export default function RatingForm() {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const currentLang = i18n.language

  // Define all service sections
  const serviceSections = [
    { id: "reception", name: t("services.reception") },
    {
      id: "room",
      name: t("services.room"),
      combined: true,
      subsections: [
        { id: "roomQuality", name: t("services.roomQuality") },
        { id: "roomComfort", name: t("services.roomComfort") },
      ],
    },
    {
      id: "restaurantMain",
      name: t("services.restaurantMain"),
      combined: true,
      subsections: [
        { id: "restaurantMainService", name: t("services.restaurantMainService") },
        { id: "restaurantMainQuality", name: t("services.restaurantMainQuality") },
      ],
    },
    {
      id: "restaurantBarbecue",
      name: t("services.restaurantBarbecue"),
      combined: true,
      subsections: [
        { id: "restaurantBarbecueService", name: t("services.restaurantBarbecueService") },
        { id: "restaurantBarbecueQuality", name: t("services.restaurantBarbecueQuality") },
      ],
    },
    {
      id: "restaurantInternational",
      name: t("services.restaurantInternational"),
      combined: true,
      subsections: [
        { id: "restaurantInternationalService", name: t("services.restaurantInternationalService") },
        { id: "restaurantInternationalQuality", name: t("services.restaurantInternationalQuality") },
      ],
    },
    { id: "animationDay", name: t("services.animationDay") },
    { id: "animationEvening", name: t("services.animationEvening") },
    { id: "bar", name: t("services.bar") },
    { id: "pool", name: t("services.pool") },
    { id: "spa", name: t("services.spa") },
    { id: "cleanliness", name: t("services.cleanliness") },
  ]

  // Flatten service sections for form initialization
  const flattenedServices = serviceSections.reduce(
    (acc, section) => {
      if (section.subsections) {
        section.subsections.forEach((subsection) => {
          acc[subsection.id] = { rating: 0, comment: "" }
        })
      } else {
        acc[section.id] = { rating: 0, comment: "" }
      }
      return acc
    },
    {} as Record<string, { rating: number; comment: string }>,
  )

  const schema = createRatingSchema(t)

  type FormData = z.infer<typeof schema>;
  
  const methods = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      nationality: "",
      age: "",
      tourOperator: {
        travelAgency: false,
        onlineWebsite: false,
        directHotel: false,
      },
      roomNumber: "",
      recommend: null as any,
      visitAgain: null as any,
      overallRating: 5,
      suggestions: "",
      services: flattenedServices,
    },
    mode: "onChange",
  })

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsSubmitting(true)

    try {
      // Convert empty string age to undefined
      const ageValue = data.age === "" ? undefined : Number(data.age);
      
      // Prepare the review data
      const reviewData = {
        fullName: data.fullName,
        nationality: data.nationality,
        age: ageValue,
        roomNumber: data.roomNumber,
        overallRating: data.overallRating,
        recommend: data.recommend === true,
        visitAgain: data.visitAgain === true,
        services: data.services,
        suggestions: data.suggestions || undefined,
      }

      console.log('Submitting review to database:', reviewData)

      // Send the data to our API endpoint
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      })

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit review');
      }

      const savedReview = await response.json();
      console.log("Review saved to database successfully:", savedReview);

      // Record submission in the API
      try {
        await fetch('/api/user-submissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.error("Error recording submission:", error);
        // Fallback to localStorage in case of API failure
        localStorage.setItem('lastReviewSubmission', new Date().toISOString());
      }

      // Redirect to thank you page
      router.push(`/${currentLang}/thank-you`)
    } catch (error) {
      console.error("Error submitting form:", error)
      setIsSubmitting(false)
      // You could add toast notification here for error feedback
    }
  }

  // Create steps for the form
  const steps = [
    {
      title: t("userInfo.title"),
      component: <UserInfoSection />,
      validateFields: ["fullName", "nationality", "age", "tourOperator", "roomNumber"],
    },
  ]

  // Add service rating steps
  serviceSections.forEach((section) => {
    if (section.subsections && section.combined) {
      // For combined sections (room, restaurants)
      steps.push({
        title: section.name,
        component: (
          <CombinedRatingSection
            key={section.id}
            serviceId1={section.subsections[0].id}
            serviceName1={section.subsections[0].name}
            serviceId2={section.subsections[1].id}
            serviceName2={section.subsections[1].name}
            sectionTitle={section.name}
          />
        ),
        validateFields: [
          `services.${section.subsections[0].id}.rating`,
          `services.${section.subsections[1].id}.rating`,
        ],
      })
    } else if (section.subsections) {
      // For non-combined sections with subsections
      section.subsections.forEach((subsection) => {
        steps.push({
          title: `${section.name}: ${subsection.name}`,
          component: (
            <ServiceRatingSection key={subsection.id} serviceId={subsection.id} serviceName={subsection.name} />
          ),
          validateFields: [`services.${subsection.id}.rating`],
        })
      })
    } else {
      // For simple sections
      steps.push({
        title: section.name,
        component: <ServiceRatingSection key={section.id} serviceId={section.id} serviceName={section.name} />,
        validateFields: [`services.${section.id}.rating`],
      })
    }
  })

  // Add additional questions step
  steps.push({
    title: t("additionalQuestions.title"),
    component: <AdditionalQuestionsSection />,
    validateFields: ["recommend", "visitAgain", "overallRating"],
  })

  const totalSteps = steps.length
  const progress = ((currentStep + 1) / totalSteps) * 100

  const validateStep = async () => {
    const fields = steps[currentStep].validateFields
    const result = await methods.trigger(fields as any)
    return result
  }

  const goToNextStep = async () => {
    const isValid = await validateStep()
    if (isValid && currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
      window.scrollTo(0, 0)
    }
  }

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      window.scrollTo(0, 0)
    }
  }

  const goToHome = () => {
    router.push("/")
  }

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen py-8 px-4 bg-gradient-to-b from-background to-muted/30">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-start items-center mb-6">
            <Button variant="ghost" size="icon" onClick={goToHome} className="rounded-full">
              <Home className="h-5 w-5" />
              <span className="sr-only">{t("common.home")}</span>
            </Button>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-center mb-2 text-primary">{t("form.title")}</h1>
            <p className="text-center text-muted-foreground text-lg mb-4">{t("form.description")}</p>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t("common.step", { current: currentStep + 1, total: totalSteps })}</span>
                <span>{steps[currentStep].title}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>

          <form onSubmit={methods.handleSubmit(onSubmit)}>
            <div className="space-y-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="premium-card overflow-hidden">
                    <div className="h-2 premium-gradient-bg w-full"></div>
                    <CardHeader>
                      <CardTitle className="text-2xl text-primary">{steps[currentStep].title}</CardTitle>
                      {currentStep === 0 && (
                        <CardDescription className="text-base">{t("form.personalInfo")}</CardDescription>
                      )}
                    </CardHeader>
                    {steps[currentStep].component}
                    <CardFooter className="flex justify-between gap-4 p-6 pt-8">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={goToPreviousStep}
                        disabled={currentStep === 0}
                        className="min-w-[120px] h-12 premium-border"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {t("common.previous")}
                      </Button>

                      {currentStep < totalSteps - 1 ? (
                        <Button type="button" onClick={goToNextStep} className="min-w-[120px] h-12 premium-button">
                          {t("common.next")}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      ) : (
                        <Button type="submit" disabled={isSubmitting} className="min-w-[120px] h-12 premium-button">
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {t("form.submitting")}
                            </>
                          ) : (
                            <>
                              {t("form.submit")}
                              <Send className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                </motion.div>
              </AnimatePresence>
            </div>
          </form>
        </div>
      </div>
    </FormProvider>
  )
}
