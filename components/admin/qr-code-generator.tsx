"use client"

import { Input } from "@/components/ui/input"

import { Label } from "@/components/ui/label"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { QrCode, Download, Copy, Printer, Clock, Users } from "lucide-react"
import { format } from "date-fns"

interface VotingSession {
  id: string
  title: string
  description?: string
  duration: number
  startTime?: Date
  endTime?: Date
  status: "draft" | "active" | "completed" | "paused"
  qrCode: string
  votingUrl: string
  votes: any[]
  createdAt: Date
}

interface QRCodeGeneratorProps {
  session: VotingSession
  onClose: () => void
}

export default function QRCodeGenerator({ session, onClose }: QRCodeGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState("")

  // Generate QR code using a QR code API or library
  const generateQRCode = () => {
    // Using QR Server API for demo - in production, use a proper QR library
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(session.votingUrl)}`
    setQrCodeUrl(qrUrl)
  }

  useState(() => {
    generateQRCode()
  })

  const downloadQRCode = () => {
    const link = document.createElement("a")
    link.href = qrCodeUrl
    link.download = `qr-code-${session.id}.png`
    link.click()
  }

  const copyLink = () => {
    navigator.clipboard.writeText(session.votingUrl)
  }

  const printQRCode = () => {
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - ${session.title}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 20px;
                margin: 0;
              }
              .qr-container {
                max-width: 400px;
                margin: 0 auto;
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                padding: 30px;
                background: white;
              }
              .title { 
                font-size: 24px; 
                font-weight: bold; 
                margin-bottom: 10px;
                color: #1f2937;
              }
              .subtitle { 
                font-size: 16px; 
                color: #6b7280; 
                margin-bottom: 20px;
              }
              .qr-code { 
                margin: 20px 0;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
              }
              .instructions {
                font-size: 14px;
                color: #374151;
                margin-top: 20px;
                line-height: 1.5;
              }
              .duration {
                font-size: 18px;
                font-weight: bold;
                color: #dc2626;
                margin-top: 15px;
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div class="title">${session.title}</div>
              <div class="subtitle">Restaurant Rating Session</div>
              <img src="${qrCodeUrl}" alt="QR Code" class="qr-code" />
              <div class="instructions">
                Scan this QR code with your phone camera to rate your dining experience
              </div>
              <div class="duration">
                Session Duration: ${session.duration} minutes
              </div>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "paused":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      case "draft":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code - {session.title}
          </DialogTitle>
          <DialogDescription>Share this QR code with restaurant guests to collect their ratings</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Session Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={getStatusColor(session.status)}>{session.status}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="font-medium">{session.duration} minutes</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Votes Received</p>
              <p className="font-medium flex items-center gap-1">
                <Users className="h-4 w-4" />
                {session.votes.length}
              </p>
            </div>
            {session.endTime && (
              <div>
                <p className="text-sm text-muted-foreground">Ends At</p>
                <p className="font-medium flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {format(session.endTime, "HH:mm")}
                </p>
              </div>
            )}
          </div>

          {/* QR Code Display */}
          <div className="flex flex-col items-center space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 bg-white">
              {qrCodeUrl ? (
                <img src={qrCodeUrl || "/placeholder.svg"} alt="QR Code" className="w-64 h-64" />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center bg-muted rounded">
                  <QrCode className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="text-center">
              <p className="font-medium">Scan to Rate Your Experience</p>
              <p className="text-sm text-muted-foreground">Guests can scan this code to access the rating form</p>
            </div>
          </div>

          {/* Voting URL */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Direct Link</Label>
            <div className="flex gap-2">
              <Input value={session.votingUrl} readOnly className="font-mono text-sm" />
              <Button onClick={copyLink} variant="outline" size="sm" className="gap-2">
                <Copy className="h-3 w-3" />
                Copy
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <div className="flex gap-2">
              <Button onClick={downloadQRCode} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button onClick={printQRCode} variant="outline" className="gap-2">
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </div>
            <Button onClick={onClose}>Close</Button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">How to use:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Print or display this QR code at the dining table</li>
              <li>Guests scan the code with their phone camera</li>
              <li>They'll be directed to the rating form (if session is active)</li>
              <li>Ratings are collected in real-time during the session</li>
              <li>Session automatically closes after the set duration</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
