"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Eye, Star, ThumbsUp, ThumbsDown } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Review {
  id: string
  fullName: string
  nationality: string
  age: number
  roomNumber: string
  submittedAt: string
  overallRating: number
  recommend: boolean
  visitAgain: boolean
  services: Record<string, { rating: number; comment?: string }>
  suggestions?: string
}

interface ReviewsTableProps {
  reviews: Review[]
}

export default function ReviewsTable({ reviews }: ReviewsTableProps) {
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-green-600"
    if (rating >= 3) return "text-yellow-600"
    return "text-red-600"
  }

  const getRatingBadge = (rating: number) => {
    if (rating >= 8) return "bg-green-100 text-green-800"
    if (rating >= 6) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Reviews</CardTitle>
        <CardDescription>Detailed view of all customer feedback</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Overall Rating</TableHead>
                <TableHead>Recommend</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{review.fullName}</div>
                      <div className="text-sm text-muted-foreground">
                        {review.nationality}{review.age ? `, Age ${review.age}` : ''}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{review.roomNumber}</TableCell>
                  <TableCell>{new Date(review.submittedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge className={getRatingBadge(review.overallRating)}>{review.overallRating}/10</Badge>
                  </TableCell>
                  <TableCell>
                    {review.recommend ? (
                      <ThumbsUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <ThumbsDown className="h-4 w-4 text-red-600" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedReview(review)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh]">
                        <DialogHeader>
                          <DialogTitle>Review Details - {review.fullName}</DialogTitle>
                          <DialogDescription>
                            Submitted on {new Date(review.submittedAt).toLocaleDateString()}
                          </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="max-h-[60vh]">
                          <div className="space-y-6 p-4">
                            {/* Guest Information */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium mb-2">Guest Information</h4>
                                <div className="space-y-1 text-sm">
                                  <p>
                                    <strong>Name:</strong> {review.fullName}
                                  </p>
                                  <p>
                                    <strong>Nationality:</strong> {review.nationality}
                                  </p>
                                  <p>
                                    <strong>Age:</strong> {review.age}
                                  </p>
                                  <p>
                                    <strong>Room:</strong> {review.roomNumber}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Overall Feedback</h4>
                                <div className="space-y-1 text-sm">
                                  <p>
                                    <strong>Overall Rating:</strong> {review.overallRating}/10
                                  </p>
                                  <p>
                                    <strong>Would Recommend:</strong> {review.recommend ? "Yes" : "No"}
                                  </p>
                                  <p>
                                    <strong>Visit Again:</strong> {review.visitAgain ? "Yes" : "No"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Service Ratings */}
                            <div>
                              <h4 className="font-medium mb-3">Service Ratings</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(review.services).map(([serviceKey, service]) => (
                                  <div key={serviceKey} className="border rounded-lg p-3">
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="font-medium capitalize">
                                        {serviceKey.replace(/([A-Z])/g, " $1").trim()}
                                      </span>
                                      <div className="flex items-center gap-1">
                                        <Star className={`h-4 w-4 ${getRatingColor(service.rating)}`} />
                                        <span className={getRatingColor(service.rating)}>{service.rating}/5</span>
                                      </div>
                                    </div>
                                    {service.comment && (
                                      <p className="text-sm text-muted-foreground">"{service.comment}"</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Suggestions */}
                            {review.suggestions && (
                              <div>
                                <h4 className="font-medium mb-2">Additional Suggestions</h4>
                                <p className="text-sm bg-muted p-3 rounded-lg">"{review.suggestions}"</p>
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
