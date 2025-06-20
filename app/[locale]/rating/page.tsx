"use client"

import { Suspense, useEffect, useState } from "react"
import RatingForm from "@/components/rating-form"
import AlreadySubmittedPage from "@/components/already-submitted"
import { Loader2 } from "lucide-react"

export default function RatingPage() {
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkSubmissionStatus() {
      try {
        // Check if a review has been submitted within the last 24 hours using the API
        const response = await fetch('/api/user-submissions')
        
        if (!response.ok) {
          throw new Error('Failed to check submission status')
        }
        
        const data = await response.json()
        
        if (data.hasSubmittedRecently) {
          setHasSubmitted(true)
        }
      } catch (error) {
        console.error('Error checking submission status:', error)
        // Fallback to localStorage in case of API failure
        const lastSubmissionTime = localStorage.getItem('lastReviewSubmission')
        
        if (lastSubmissionTime) {
          const lastSubmission = new Date(lastSubmissionTime)
          const now = new Date()
          const hoursDifference = (now.getTime() - lastSubmission.getTime()) / (1000 * 60 * 60)
          
          // If less than 24 hours have passed since the last submission
          if (hoursDifference < 24) {
            setHasSubmitted(true)
          }
        }
      } finally {
        setIsLoading(false)
      }
    }
    
    checkSubmissionStatus()
  }, [])

  if (isLoading) {
    return (
      <main className="min-h-screen p-4 md:p-8 bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </main>
    )
  }

  if (hasSubmitted) {
    return <AlreadySubmittedPage />
  }

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <Suspense
          fallback={
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          }
        >
          <RatingForm />
        </Suspense>
      </div>
    </main>
  )
}
