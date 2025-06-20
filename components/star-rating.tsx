"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface StarRatingProps {
  rating: number
  onRatingChange: (rating: number) => void
  maxStars?: number
}

export default function StarRating({ rating, onRatingChange, maxStars = 5 }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)

  return (
    <div className="flex gap-1 sm:gap-2">
      {Array.from({ length: maxStars }).map((_, index) => {
        const starValue = index + 1
        const isActive = starValue <= (hoverRating || rating)

        return (
          <motion.button
            key={index}
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={cn(
              "rounded-md p-1 sm:p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:ring-primary transition-colors",
              isActive
                ? "text-primary"
                : "text-gray-300 hover:text-gray-400 dark:text-gray-600 dark:hover:text-gray-500",
            )}
            onMouseEnter={() => setHoverRating(starValue)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => onRatingChange(starValue)}
            aria-label={`Rate ${starValue} out of ${maxStars}`}
          >
            <Star className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 fill-current" />
          </motion.button>
        )
      })}
    </div>
  )
}
