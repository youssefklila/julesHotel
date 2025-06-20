export function generateMockData() {
  const nationalities = ["French", "German", "British", "American", "Spanish", "Italian", "Dutch", "Belgian"]
  const names = [
    "Jean Dupont",
    "Hans Mueller",
    "John Smith",
    "Maria Garcia",
    "Luigi Rossi",
    "Anna Schmidt",
    "Pierre Martin",
    "Emma Johnson",
    "Carlos Rodriguez",
    "Sophie Dubois",
  ]

  const services = [
    "reception",
    "roomQuality",
    "roomComfort",
    "restaurantMainService",
    "restaurantMainQuality",
    "bar",
    "pool",
    "spa",
    "cleanliness",
  ]

  const comments = [
    "Excellent service, very professional staff",
    "Room was clean and comfortable",
    "Food quality was outstanding",
    "Could be improved",
    "Very satisfied with the experience",
    "Staff was very helpful and friendly",
    "Great location and amenities",
    "Room service was prompt and efficient",
  ]

  const suggestions = [
    "More vegetarian options in the restaurant",
    "Faster WiFi in rooms",
    "Extended pool hours",
    "More activities for children",
    "Better soundproofing in rooms",
    "More parking spaces",
    "Improved air conditioning",
  ]

  return Array.from({ length: 150 }, (_, i) => {
    const submittedDate = new Date()
    submittedDate.setDate(submittedDate.getDate() - Math.floor(Math.random() * 90))

    const serviceRatings = services.reduce(
      (acc, service) => {
        acc[service] = {
          rating: Math.floor(Math.random() * 5) + 1,
          comment: Math.random() > 0.6 ? comments[Math.floor(Math.random() * comments.length)] : "",
        }
        return acc
      },
      {} as Record<string, { rating: number; comment: string }>,
    )

    return {
      id: `review-${i + 1}`,
      fullName: names[Math.floor(Math.random() * names.length)],
      nationality: nationalities[Math.floor(Math.random() * nationalities.length)],
      age: Math.floor(Math.random() * 50) + 25,
      roomNumber: `${Math.floor(Math.random() * 5) + 1}${Math.floor(Math.random() * 50) + 10}`,
      submittedAt: submittedDate.toISOString(),
      overallRating: Math.floor(Math.random() * 11),
      recommend: Math.random() > 0.3,
      visitAgain: Math.random() > 0.4,
      services: serviceRatings,
      suggestions: Math.random() > 0.7 ? suggestions[Math.floor(Math.random() * suggestions.length)] : "",
    }
  })
}
