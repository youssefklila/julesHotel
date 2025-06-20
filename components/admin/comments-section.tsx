"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Star, Search, MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react"

interface Comment {
  id: string
  guestName: string
  service: string
  serviceName: string
  rating: number
  comment: string
  submittedAt: string
  sentiment: "positive" | "negative" | "neutral"
  roomNumber: string
}

interface CommentsSectionProps {
  reviews: any[]
  serviceCategories: { key: string; name: string }[]
  selectedCategory: string
}

export default function CommentsSection({ reviews, serviceCategories, selectedCategory }: CommentsSectionProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterService, setFilterService] = useState("all")
  const [filterSentiment, setFilterSentiment] = useState("all")
  const [filterRating, setFilterRating] = useState("all")

  // Extract all comments from reviews
  const allComments: Comment[] = reviews.flatMap((review) =>
    Object.entries(review.services)
      .filter(([_, service]: [string, any]) => service.comment && service.comment.trim())
      .map(([serviceKey, service]: [string, any]) => ({
        id: `${review.id}-${serviceKey}`,
        guestName: review.fullName,
        service: serviceKey,
        serviceName: serviceCategories.find((cat) => cat.key === serviceKey)?.name || serviceKey,
        rating: service.rating,
        comment: service.comment,
        submittedAt: review.submittedAt,
        sentiment: getSentiment(service.comment, service.rating),
        roomNumber: review.roomNumber,
      })),
  )

  function getSentiment(comment: string, rating: number): "positive" | "negative" | "neutral" {
    if (rating >= 4) return "positive"
    if (rating <= 2) return "negative"
    return "neutral"
  }

  // Filter comments
  const filteredComments = allComments.filter((comment) => {
    const matchesSearch =
      comment.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.guestName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesService = filterService === "all" || comment.service === filterService
    const matchesSentiment = filterSentiment === "all" || comment.sentiment === filterSentiment
    const matchesRating =
      filterRating === "all" ||
      (filterRating === "high" && comment.rating >= 4) ||
      (filterRating === "medium" && comment.rating === 3) ||
      (filterRating === "low" && comment.rating <= 2)

    return matchesSearch && matchesService && matchesSentiment && matchesRating
  })

  // Group comments by service
  const commentsByService = serviceCategories.reduce(
    (acc, category) => {
      acc[category.key] = filteredComments.filter((comment) => comment.service === category.key)
      return acc
    },
    {} as Record<string, Comment[]>,
  )

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-100 text-green-800"
      case "negative":
        return "bg-red-100 text-red-800"
      case "neutral":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return <ThumbsUp className="h-3 w-3" />
      case "negative":
        return <ThumbsDown className="h-3 w-3" />
      default:
        return <MessageSquare className="h-3 w-3" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Comments Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{allComments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Positive Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {allComments.filter((c) => c.sentiment === "positive").length}
            </div>
            <p className="text-xs text-muted-foreground">
              {((allComments.filter((c) => c.sentiment === "positive").length / allComments.length) * 100 || 0).toFixed(
                1,
              )}
              %
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Negative Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {allComments.filter((c) => c.sentiment === "negative").length}
            </div>
            <p className="text-xs text-muted-foreground">
              {((allComments.filter((c) => c.sentiment === "negative").length / allComments.length) * 100 || 0).toFixed(
                1,
              )}
              %
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Neutral Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {allComments.filter((c) => c.sentiment === "neutral").length}
            </div>
            <p className="text-xs text-muted-foreground">
              {((allComments.filter((c) => c.sentiment === "neutral").length / allComments.length) * 100 || 0).toFixed(
                1,
              )}
              %
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filter Comments
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Input
            placeholder="Search comments or guest names..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <Select value={filterService} onValueChange={setFilterService}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {serviceCategories.map((category) => (
                <SelectItem key={category.key} value={category.key}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterSentiment} onValueChange={setFilterSentiment}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by sentiment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sentiments</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="negative">Negative</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterRating} onValueChange={setFilterRating}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="high">High (4-5 stars)</SelectItem>
              <SelectItem value="medium">Medium (3 stars)</SelectItem>
              <SelectItem value="low">Low (1-2 stars)</SelectItem>
            </SelectContent>
          </Select>

          <div className="text-sm text-muted-foreground flex items-center">
            Showing {filteredComments.length} of {allComments.length} comments
          </div>
        </CardContent>
      </Card>

      {/* Comments by Service Category */}
      {serviceCategories.map((category) => {
        const categoryComments = commentsByService[category.key] || []
        if (categoryComments.length === 0) return null

        return (
          <Card key={category.key}>
            <CardHeader>
              <CardTitle>{category.name}</CardTitle>
              <CardDescription>
                {categoryComments.length} comments • Average rating:{" "}
                {(categoryComments.reduce((sum, c) => sum + c.rating, 0) / categoryComments.length).toFixed(1)}/5
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryComments.map((comment) => (
                  <div key={comment.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{comment.guestName}</p>
                          <p className="text-sm text-muted-foreground">
                            Room {comment.roomNumber} • {new Date(comment.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={getSentimentColor(comment.sentiment)}>
                          {getSentimentIcon(comment.sentiment)}
                          {comment.sentiment}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < comment.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                            }`}
                          />
                        ))}
                        <span className="ml-1 font-medium">{comment.rating}/5</span>
                      </div>
                    </div>

                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-sm">"{comment.comment}"</p>
                    </div>

                    {/* Reply button removed as requested */}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {filteredComments.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No comments found matching your filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
