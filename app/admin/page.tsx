"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function AdminHome() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the admin login page
    router.push("/admin/login")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
        <p className="text-muted-foreground">Redirecting to admin login page...</p>
      </div>
    </div>
  )
}
