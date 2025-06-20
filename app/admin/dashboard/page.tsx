"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import { Users, Star, TrendingUp, Download, LogOut, Filter, MessageSquare, AlertTriangle, KeyRound, ChevronUp, ChevronDown, Minus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import ReviewsTable from "@/components/admin/reviews-table"
import ServiceRatingsOverview from "@/components/admin/service-ratings-overview"
import CommentsSection from "@/components/admin/comments-section"
import { generateMockData } from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"
import { format, subDays, subHours, isWithinInterval } from "date-fns"
import ChangePasswordDialog from "@/components/admin/change-password-dialog"

export default function AdminDashboard() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState("")
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [reviews, setReviews] = useState<any[]>([])
  const [filteredReviews, setFilteredReviews] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterPeriod, setFilterPeriod] = useState("all")
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>()
  const [selectedCategory, setSelectedCategory] = useState("all")

  useEffect(() => {
    // Check authentication using cookies instead of localStorage
    // The middleware.ts file will handle redirecting if not authenticated
    // We just need to fetch the current user info from the server
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/user-info')
        if (!response.ok) {
          // If not authenticated, the middleware should have redirected already
          // But just in case, we'll handle it here too
          router.push("/admin/login")
          return
        }
        
        const userData = await response.json()
        setIsAuthenticated(true)
        setCurrentUser(userData.username || "admin")
      } catch (error) {
        console.error('Error fetching user info:', error)
        router.push("/admin/login")
      }
    }
    
    fetchUserInfo()

    // Initialize the database and fetch real reviews from the database
    const initializeDbAndFetchReviews = async () => {
      try {
        // First initialize the database
        await fetch('/api/init-db')
        
        // Then fetch the reviews
        const response = await fetch('/api/reviews')
        if (!response.ok) {
          throw new Error('Failed to fetch reviews')
        }
        
        const responseData = await response.json()
        console.log('Fetched reviews:', responseData)
        
        // The API now returns { data: [], pagination: { ... } }
        const dbReviews = responseData.data || []
        
        if (dbReviews.length === 0) {
          // If there are no reviews at all, use mock data
          const mockReviews = generateMockData()
          setReviews(mockReviews)
          setFilteredReviews(mockReviews)
        } else {
          setReviews(dbReviews)
          setFilteredReviews(dbReviews)
        }
      } catch (error) {
        console.error('Error fetching reviews:', error)
        // Fallback to mock data if there's an error
        const mockReviews = generateMockData()
        setReviews(mockReviews)
        setFilteredReviews(mockReviews)
      }
    }
    
    initializeDbAndFetchReviews()
    
    // Set up polling to refresh reviews every 10 seconds
    const intervalId = setInterval(initializeDbAndFetchReviews, 10000)
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId)
  }, [router])

  useEffect(() => {
    // Filter reviews based on search, period, and date range
    let filtered = reviews

    if (searchTerm) {
      filtered = filtered.filter(
        (review) =>
          review.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          review.nationality.toLowerCase().includes(searchTerm.toLowerCase()) ||
          review.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply time filters
    if (dateRange?.from && dateRange?.to) {
      filtered = filtered.filter((review) =>
        isWithinInterval(new Date(review.submittedAt), {
          start: dateRange.from,
          end: dateRange.to,
        }),
      )
    } else if (filterPeriod !== "all") {
      const now = new Date()
      let cutoff = new Date()
      
      if (filterPeriod === '24h') {
        cutoff = subHours(now, 24)
      } else {
        const days = filterPeriod === "7d" ? 7 : filterPeriod === "30d" ? 30 : 90
        cutoff = subDays(now, days)
      }
      
      filtered = filtered.filter((review) => new Date(review.submittedAt) >= cutoff)
    }

    setFilteredReviews(filtered)
  }, [reviews, searchTerm, filterPeriod, dateRange])

  const handleLogout = () => {
    localStorage.removeItem("adminAuth")
    router.push("/admin/login")
  }

  const exportData = () => {
    // Enhanced CSV export with service ratings
    const headers = [
      "Name",
      "Nationality",
      "Age",
      "Room",
      "Submitted",
      "Overall Rating",
      "Reception",
      "Room Quality",
      "Room Comfort",
      "Restaurant Main Service",
      "Restaurant Main Quality",
      "Restaurant BBQ Service",
      "Restaurant BBQ Quality",
      "Restaurant Intl Service",
      "Restaurant Intl Quality",
      "Animation Day",
      "Animation Evening",
      "Bar",
      "Pool",
      "Spa",
      "Cleanliness",
      "Recommend",
      "Visit Again",
      "Suggestions",
    ]

    const csvData = filteredReviews.map((review) => [
      review.fullName,
      review.nationality,
      review.age,
      review.roomNumber,
      new Date(review.submittedAt).toLocaleDateString(),
      review.overallRating,
      review.services.reception?.rating || "N/A",
      review.services.roomQuality?.rating || "N/A",
      review.services.roomComfort?.rating || "N/A",
      review.services.restaurantMainService?.rating || "N/A",
      review.services.restaurantMainQuality?.rating || "N/A",
      review.services.restaurantBarbecueService?.rating || "N/A",
      review.services.restaurantBarbecueQuality?.rating || "N/A",
      review.services.restaurantInternationalService?.rating || "N/A",
      review.services.restaurantInternationalQuality?.rating || "N/A",
      review.services.animationDay?.rating || "N/A",
      review.services.animationEvening?.rating || "N/A",
      review.services.bar?.rating || "N/A",
      review.services.pool?.rating || "N/A",
      review.services.spa?.rating || "N/A",
      review.services.cleanliness?.rating || "N/A",
      review.recommend ? "Yes" : "No",
      review.visitAgain ? "Yes" : "No",
      `"${review.suggestions || ""}"`,
    ])

    const csv = [headers, ...csvData].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `hotel-reviews-detailed-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  if (!isAuthenticated) {
    return <div>Loading...</div>
  }

  // Calculate comprehensive metrics
  const totalReviews = filteredReviews.length
  
  // Calculate NPS (Net Promoter Score)
  const promoters = filteredReviews.filter(review => review.overallRating >= 9).length
  const passives = filteredReviews.filter(review => review.overallRating >= 7 && review.overallRating <= 8).length
  const detractors = filteredReviews.filter(review => review.overallRating <= 6).length
  const nps = totalReviews > 0 ? Math.round(((promoters - detractors) / totalReviews) * 100) : 0
  
  // Get NPS category
  const getNPSCategory = (score: number) => {
    if (score <= 0) return 'Needs Improvement';
    if (score <= 30) return 'Good';
    if (score <= 50) return 'Great';
    if (score <= 70) return 'Excellent';
    return 'World Class';
  }
  
  const npsCategory = getNPSCategory(nps)
  const npsCategoryColor = 
    nps <= 0 ? 'text-red-600' : 
    nps <= 30 ? 'text-yellow-600' : 
    nps <= 50 ? 'text-blue-600' : 'text-green-600'
  
  const recommendationRate = (filteredReviews.filter((review) => review.recommend).length / totalReviews) * 100 || 0

  // Calculate service averages
  const serviceCategories = [
    { key: "reception", name: "Reception" },
    { key: "roomQuality", name: "Room Quality" },
    { key: "roomComfort", name: "Room Comfort" },
    { key: "restaurantMainService", name: "Main Restaurant Service" },
    { key: "restaurantMainQuality", name: "Main Restaurant Quality" },
    { key: "restaurantBarbecueService", name: "BBQ Restaurant Service" },
    { key: "restaurantBarbecueQuality", name: "BBQ Restaurant Quality" },
    { key: "restaurantInternationalService", name: "International Restaurant Service" },
    { key: "restaurantInternationalQuality", name: "International Restaurant Quality" },
    { key: "animationDay", name: "Day Animation" },
    { key: "animationEvening", name: "Evening Animation" },
    { key: "bar", name: "Bar" },
    { key: "pool", name: "Pool" },
    { key: "spa", name: "Spa" },
    { key: "cleanliness", name: "Cleanliness" },
  ]

  type ServiceStatus = "excellent" | "good" | "fair" | "poor";

  interface ServiceAverage {
    key: string;
    name: string;
    average: number;
    count: number;
    status: ServiceStatus;
  }

  const serviceAverages = serviceCategories.map((category) => {
    const ratings = filteredReviews
      .map((review) => review.services[category.key]?.rating)
      .filter((rating) => rating !== undefined && rating > 0)

    const average = ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0
    const count = ratings.length
    const status: ServiceStatus = average >= 4 ? "excellent" : average >= 3 ? "good" : average >= 2 ? "fair" : "poor"

    return {
      ...category,
      average: Number(average.toFixed(2)),
      count,
      status,
    }
  })

  // Low-rated services (below 3.0)
  const lowRatedServices = serviceAverages.filter((service) => service.average < 3.0 && service.count > 0)

  // Time-based trend data
  interface TrendDataItem {
    date: string;
    totalRating: number;
    count: number;
    average: number;
  }

  const trendData = filteredReviews
    .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
    .reduce<TrendDataItem[]>((acc, review) => {
      const date = new Date(review.submittedAt).toLocaleDateString()
      const existing = acc.find((item) => item.date === date)

      if (existing) {
        existing.totalRating += review.overallRating
        existing.count += 1
        existing.average = Number((existing.totalRating / existing.count).toFixed(1))
      } else {
        acc.push({
          date,
          totalRating: review.overallRating,
          count: 1,
          average: review.overallRating,
        })
      }

      return acc
    }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Change Password Dialog */}
      <ChangePasswordDialog 
        open={isChangePasswordOpen} 
        onOpenChange={setIsChangePasswordOpen} 
        username={currentUser} 
      />
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary">Hotel Review Dashboard</h1>
            <p className="text-muted-foreground">Review analytics and customer feedback insights</p>
          </div>
          <div className="flex items-center gap-4">
            {lowRatedServices.length > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {lowRatedServices.length} Low Rated Services
              </Badge>
            )}
            <Button onClick={exportData} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Data
            </Button>
            <Button onClick={() => setIsChangePasswordOpen(true)} variant="outline" className="gap-2">
              <KeyRound className="h-4 w-4" />
              Change Password
            </Button>
            <Button onClick={handleLogout} variant="ghost" className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Enhanced Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Advanced Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search by name, nationality, or room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
            <DatePickerWithRange date={dateRange} setDate={(date) => setDateRange(date as any)} />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* NPS Card - Takes full width on mobile, 6 columns on md, 5 on lg */}
          <div className="md:col-span-6 lg:col-span-5">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Net Promoter Score</CardTitle>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">-100 to +100</span>
                  </div>
                </div>
                
                {/* Score Display */}
                <div className="mt-2">
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-primary">{nps}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${nps >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {nps >= 0 ? '+' : ''}{nps} points
                    </span>
                  </div>
                  <p className={`text-sm font-medium mt-1 ${npsCategoryColor}`}>
                    {npsCategory}
                  </p>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Detractors</span>
                    <span>Passives</span>
                    <span>Promoters</span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full flex">
                      <div 
                        className="bg-red-500" 
                        style={{ width: `${(detractors / totalReviews) * 100}%` }}
                        title={`${Math.round((detractors / totalReviews) * 100)}% Detractors`}
                      />
                      <div 
                        className="bg-yellow-400" 
                        style={{ width: `${(passives / totalReviews) * 100}%` }}
                        title={`${Math.round((passives / totalReviews) * 100)}% Passives`}
                      />
                      <div 
                        className="bg-green-500" 
                        style={{ width: `${(promoters / totalReviews) * 100}%` }}
                        title={`${Math.round((promoters / totalReviews) * 100)}% Promoters`}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Score Breakdown */}
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-red-600">
                      <ChevronDown className="h-4 w-4" />
                      <span className="font-medium">{detractors}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Detractors</p>
                    <p className="text-xs font-medium">0-6</p>
                  </div>
                  
                  <div className="p-2 bg-yellow-50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-yellow-600">
                      <Minus className="h-4 w-4" />
                      <span className="font-medium">{passives}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Passives</p>
                    <p className="text-xs font-medium">7-8</p>
                  </div>
                  
                  <div className="p-2 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-green-600">
                      <ChevronUp className="h-4 w-4" />
                      <span className="font-medium">{promoters}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Promoters</p>
                    <p className="text-xs font-medium">9-10</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {/* NPS formula removed as per request */}
              </CardContent>
            </Card>
          </div>
          
          {/* Other metrics */}
          <div className="md:col-span-6 lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{totalReviews}</div>
                <p className="text-xs text-muted-foreground">Customer feedback received</p>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Service Average</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {(
                    serviceAverages.reduce((sum, s) => sum + s.average, 0) /
                      serviceAverages.filter((s) => s.count > 0).length || 0
                  ).toFixed(1)}
                  /5
                </div>
                <p className="text-xs text-muted-foreground">Avg. service rating</p>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recommendation</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{recommendationRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Would recommend</p>
              </CardContent>
            </Card>
            
            <div className="sm:col-span-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-medium">Feedback Comments</CardTitle>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {filteredReviews.reduce((sum, r) => sum + Object.values(r.services).filter((s: any) => s.comment).length, 0)} comments
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    View and manage all customer feedback in the "Comments" tab below.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        {/* Enhanced Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="services">Service Ratings</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="reviews">All Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Rating Distribution</CardTitle>
                  <CardDescription>Overall rating scores (0-10)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={Array.from({ length: 11 }, (_, i) => ({
                        rating: i,
                        count: filteredReviews.filter((review) => review.overallRating === i).length,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="rating" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#2563eb" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Service Performance Radar</CardTitle>
                  <CardDescription>Average ratings across all services</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={serviceAverages.slice(0, 8)}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
                      <Radar
                        name="Average Rating"
                        dataKey="average"
                        stroke="#2563eb"
                        fill="#2563eb"
                        fillOpacity={0.3}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="services">
            <ServiceRatingsOverview
              serviceAverages={serviceAverages}
              reviews={filteredReviews}
              selectedCategory={selectedCategory}
            />
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Rating Trends Over Time</CardTitle>
                <CardDescription>Daily average ratings trend</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="average" stroke="#2563eb" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comments">
            <CommentsSection
              reviews={filteredReviews}
              serviceCategories={serviceCategories}
              selectedCategory={selectedCategory}
            />
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewsTable reviews={filteredReviews} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
