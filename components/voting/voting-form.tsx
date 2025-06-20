"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Send, Star, Utensils, Coffee, Users, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import StarRating from "@/components/star-rating"

const voteSchema = z.object({
  foodQuality: z.number().min(1, "Please rate the food quality").max(5),
  serviceQuality: z.number().min(1, "Please rate the service quality").max(5),
  ambiance: z.number().min(1, "Please rate the ambiance").max(5),
  valueForMoney: z.number().min(1, "Please rate the value for money").max(5),
  overallExperience: z.number().min(1, "Please rate your overall experience").max(5),
  comments: z.string().optional(),
  wouldRecommend: z.boolean().optional(),
})

type VoteForm = z.infer<typeof voteSchema>

interface VotingSession {
  id: string
  title: string
  votes: any[]
  status?: string
  endTime?: string
}

interface VotingFormProps {
  session: VotingSession
  onVoteSubmitted: () => void
}

export default function VotingForm({ session, onVoteSubmitted }: VotingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const methods = useForm<VoteForm>({
    resolver: zodResolver(voteSchema),
    defaultValues: {
      foodQuality: 0,
      serviceQuality: 0,
      ambiance: 0,
      valueForMoney: 0,
      overallExperience: 0,
      comments: "",
      wouldRecommend: undefined,
    },
  })

  const onSubmit = async (data: VoteForm) => {
    // Validate session is still active
    const currentSessions = JSON.parse(localStorage.getItem("votingSessions") || "[]")
    const currentSession = currentSessions.find((s: any) => s.id === session.id)

    if (!currentSession || currentSession.status !== "active") {
      alert("This voting session is no longer active. Please refresh the page.")
      return
    }

    // Check if session has expired
    if (currentSession.endTime && new Date() > new Date(currentSession.endTime)) {
      alert("This voting session has expired. Thank you for your interest.")
      return
    }

    setIsSubmitting(true)

    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Create vote record
      const vote = {
        id: `vote-${Date.now()}`,
        sessionId: session.id,
        ...data,
        submittedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
      }

      // Save vote to session
      const savedSessions = JSON.parse(localStorage.getItem("votingSessions") || "[]")
      const updatedSessions = savedSessions.map((s: any) => {
        if (s.id === session.id) {
          return {
            ...s,
            votes: [...(s.votes || []), vote],
          }
        }
        return s
      })

      localStorage.setItem("votingSessions", JSON.stringify(updatedSessions))

      // Mark user as voted
      localStorage.setItem(`vote-${session.id}`, JSON.stringify(vote))

      onVoteSubmitted()
    } catch (error) {
      console.error("Error submitting vote:", error)
      setIsSubmitting(false)
    }
  }

  const ratingCategories = [
    {
      key: "foodQuality" as keyof VoteForm,
      title: "Food Quality",
      description: "How would you rate the taste, presentation, and freshness of your meal?",
      icon: <Utensils className="h-5 w-5" />,
    },
    {
      key: "serviceQuality" as keyof VoteForm,
      title: "Service Quality",
      description: "How would you rate the attentiveness and friendliness of our staff?",
      icon: <Users className="h-5 w-5" />,
    },
    {
      key: "ambiance" as keyof VoteForm,
      title: "Ambiance",
      description: "How would you rate the atmosphere, cleanliness, and comfort?",
      icon: <Sparkles className="h-5 w-5" />,
    },
    {
      key: "valueForMoney" as keyof VoteForm,
      title: "Value for Money",
      description: "How would you rate the value you received for the price paid?",
      icon: <Coffee className="h-5 w-5" />,
    },
    {
      key: "overallExperience" as keyof VoteForm,
      title: "Overall Experience",
      description: "How would you rate your overall dining experience with us?",
      icon: <Star className="h-5 w-5" />,
    },
  ]

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Rate Your Dining Experience</CardTitle>
            <CardDescription>
              Your feedback helps us improve our service. Please rate each aspect of your experience.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-4 sm:px-6">
            {/* Rating Categories */}
            {ratingCategories.map((category, index) => (
              <motion.div
                key={category.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <FormField
                  control={methods.control}
                  name={category.key}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-lg font-medium text-primary">
                        {category.icon}
                        {category.title}
                      </FormLabel>
                      <p className="text-sm text-muted-foreground mb-3">{category.description}</p>
                      <FormControl>
                        <div className="flex justify-center py-2 px-2">
                          <StarRating rating={field.value} onRatingChange={field.onChange} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>
            ))}

            {/* Comments Section */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
              <FormField
                control={methods.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-medium text-primary">Additional Comments (Optional)</FormLabel>
                    <p className="text-sm text-muted-foreground mb-3">
                      Share any specific feedback, compliments, or suggestions for improvement.
                    </p>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about your experience..."
                        className="min-h-[100px] text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>

            {/* Recommendation */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}>
              <FormField
                control={methods.control}
                name="wouldRecommend"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-medium text-primary">
                      Would you recommend us to others?
                    </FormLabel>
                    <FormControl>
                      <div className="flex gap-2 sm:gap-4 justify-center pt-2">
                        <Button
                          type="button"
                          variant={field.value === true ? "default" : "outline"}
                          onClick={() => field.onChange(true)}
                          className="px-6 sm:px-8"
                        >
                          Yes
                        </Button>
                        <Button
                          type="button"
                          variant={field.value === false ? "default" : "outline"}
                          onClick={() => field.onChange(false)}
                          className="px-6 sm:px-8"
                        >
                          No
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-center pt-4"
            >
              <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-lg premium-button" size="lg">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting Your Rating...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Submit Rating
                  </>
                )}
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </form>
    </FormProvider>
  )
}
