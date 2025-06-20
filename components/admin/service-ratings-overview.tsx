"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface ServiceAverage {
  key: string
  name: string
  average: number
  count: number
  status: "excellent" | "good" | "fair" | "poor"
}

interface ServiceRatingsOverviewProps {
  serviceAverages: ServiceAverage[]
  reviews: any[]
  selectedCategory: string
}

export default function ServiceRatingsOverview({
  serviceAverages,
  reviews,
  selectedCategory,
}: ServiceRatingsOverviewProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "bg-green-100 text-green-800"
      case "good":
        return "bg-blue-100 text-blue-800"
      case "fair":
        return "bg-yellow-100 text-yellow-800"
      case "poor":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "excellent":
        return <TrendingUp className="h-3 w-3" />
      case "good":
        return <TrendingUp className="h-3 w-3" />
      case "fair":
        return <AlertTriangle className="h-3 w-3" />
      case "poor":
        return <TrendingDown className="h-3 w-3" />
      default:
        return null
    }
  }

  // Group services by category
  const roomServices = serviceAverages.filter((s) => s.key.includes("room"))
  const restaurantServices = serviceAverages.filter((s) => s.key.includes("restaurant"))
  const amenityServices = serviceAverages.filter((s) => ["bar", "pool", "spa"].includes(s.key))
  const cleanlinessServices = serviceAverages.filter((s) => s.key === "cleanliness")
  const animationServices = serviceAverages.filter((s) => s.key.includes("animation"))
  const receptionServices = serviceAverages.filter(
    (s) =>
      !s.key.includes("room") &&
      !s.key.includes("restaurant") &&
      !["bar", "pool", "spa", "cleanliness"].includes(s.key) &&
      !s.key.includes("animation"),
  )

  const serviceGroups = [
    { title: "Room Services", services: roomServices, icon: "🏨" },
    { title: "Restaurant Services", services: restaurantServices, icon: "🍽️" },
    { title: "Amenities", services: amenityServices, icon: "🍸" },
    { title: "Cleanliness", services: cleanlinessServices, icon: "✨" },
    { title: "Animation", services: animationServices, icon: "🎭" },
    { title: "Reception Services", services: receptionServices, icon: "👋" },
  ]

  // Filter data if specific category is selected
  const filteredGroups =
    selectedCategory === "all"
      ? serviceGroups
      : serviceGroups
          .map((group) => ({
            ...group,
            services: group.services.filter((s) => s.key === selectedCategory),
          }))
          .filter((group) => group.services.length > 0)

  return (
    <div className="space-y-6">
      {/* Service Categories Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {serviceGroups.map((group) => {
          const groupAverage =
            group.services.length > 0
              ? group.services.reduce((sum, s) => sum + s.average, 0) / group.services.filter((s) => s.count > 0).length
              : 0

          return (
            <Card key={group.title}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span>{group.icon}</span>
                  {group.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{groupAverage.toFixed(1)}/5</div>
                <div className="flex items-center gap-1 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < Math.floor(groupAverage) ? "text-yellow-400 fill-current" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {group.services.filter((s) => s.count > 0).length} services
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Detailed Service Ratings */}
      {filteredGroups.map(
        (group) =>
          group.services.length > 0 && (
            <Card key={group.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>{group.icon}</span>
                  {group.title}
                </CardTitle>
                <CardDescription>Detailed ratings and performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {group.services.map((service) => (
                    <div key={service.key} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium">{service.name}</h4>
                          <Badge className={getStatusColor(service.status)}>
                            {getStatusIcon(service.status)}
                            {service.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < Math.floor(service.average) ? "text-yellow-400 fill-current" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-bold text-lg">{service.average.toFixed(1)}/5</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Total Reviews</p>
                          <p className="font-medium">{service.count} reviews</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Rating Distribution</p>
                          <div className="space-y-2">
                            {Array.from({ length: 5 }).map((_, i) => {
                              const ratingValue = 5 - i // Show 5 stars to 1 star
                              const ratingCount = reviews.filter(
                                (r) => r.services[service.key]?.rating === ratingValue,
                              ).length
                              const percentage = service.count > 0 ? (ratingCount / service.count) * 100 : 0
                              
                              return (
                                <div key={ratingValue} className="flex items-center gap-2">
                                  <div className="flex items-center w-16">
                                    <span className="text-sm font-medium w-4">{ratingValue}</span>
                                    <Star className="h-3.5 w-3.5 text-yellow-400 fill-current ml-1" />
                                    <span className="text-xs text-muted-foreground ml-1">({ratingCount})</span>
                                  </div>
                                  <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2.5">
                                    <div 
                                      className="h-full bg-primary rounded-full transition-all duration-300" 
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  <span className="text-xs w-12 text-right text-muted-foreground">
                                    {percentage.toFixed(0)}%
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ),
      )}

      {/* Service Comparison Chart removed as requested */}
    </div>
  )
}
