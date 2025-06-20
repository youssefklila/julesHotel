"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, CheckCircle, XCircle, Timer } from "lucide-react"
import { motion } from "framer-motion"
import { format, differenceInSeconds } from "date-fns"
import VotingForm from "@/components/voting/voting-form"

// Use the VotingSession interface from schema, assuming it's compatible or adjust as needed
// For this refactor, we'll redefine a local one that matches API response and page needs.
interface PageVotingSession {
  id: string;
  title: string;
  description?: string;
  duration_minutes: number; // API returns duration_minutes
  start_time?: string; // ISO string
  end_time?: string; // ISO string
  status: "draft" | "active" | "completed" | "paused" | "expired" | "pending_start"; // Add API specific statuses
  // qrCode and votingUrl are not directly used on this page from session object itself
  // votes array is not returned by the new API endpoint for a single session
  created_at: string; // ISO string
  // Add other fields if returned by API and needed by the page
}

export default function VotePage() {
  const params = useParams();
  const router = useRouter();
  const [session, setSession] = useState<PageVotingSession | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false); // This might be redundant if API status is 'expired'
  const [hasVoted, setHasVoted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionTitleFromError, setSessionTitleFromError] = useState<string | null>(null);

  const slug = params.sessionId as string;

  useEffect(() => {
    if (!slug) {
      setIsLoading(false);
      setErrorMessage("No session identifier provided.");
      return;
    }

    const fetchSessionDetails = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      setSessionTitleFromError(null);

      try {
        const response = await fetch(`/api/voting-sessions/slug/${slug}`);
        const data = await response.json();

        if (response.ok) {
          // Dates are already ISO strings from the API
          setSession(data);
          // Check if user has already voted for this session ID (data.id)
          if (localStorage.getItem(`vote-${data.id}`)) {
            setHasVoted(true);
          }
        } else {
          setErrorMessage(data.message || "Failed to load session details.");
          if(data.sessionTitle) setSessionTitleFromError(data.sessionTitle);
          // Update session status based on API error if needed for UI
          if (data.status) {
            setSession(prev => prev ? {...prev, status: data.status, title: data.sessionTitle || prev.title } : { status: data.status, title: data.sessionTitle } as any);
          }
        }
      } catch (error) {
        console.error("Error fetching session details:", error);
        setErrorMessage("An error occurred while trying to load the session.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessionDetails();
  }, [slug]);

  useEffect(() => {
    if (!session || !session.end_time || session.status !== "active") {
      setTimeRemaining(0);
      if (session && (session.status === "completed" || session.status === "expired")) {
        setIsExpired(true);
      }
      return;
    }

    const endTimeDate = new Date(session.end_time);

    const timer = setInterval(() => {
      const now = new Date();
      const remaining = differenceInSeconds(endTimeDate, now);

      if (remaining <= 0) {
        setIsExpired(true); // Local state for UI reactivity before potential API update
        setTimeRemaining(0);
        setSession(prev => prev ? {...prev, status: "expired" } : null); // Update local status
        clearInterval(timer);
      } else {
        setIsExpired(false);
        setTimeRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [session]);

  const formatTimeRemaining = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const getProgressPercentage = () => {
    if (!session || !session.start_time || !session.end_time || session.status !== 'active') return 0;
    const startTimeDate = new Date(session.start_time);
    const endTimeDate = new Date(session.end_time);
    const totalDuration = differenceInSeconds(endTimeDate, startTimeDate);
    if (totalDuration <= 0) return 0; // Avoid division by zero or negative duration
    const elapsed = totalDuration - timeRemaining;
    return Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading voting session...</p>
        </div>
      </div>
    )
  }

  // Handle API error messages or session not found
  if (!isLoading && (errorMessage || !session)) {
    let title = "Error";
    let icon = <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />;
    let displayedMessage = errorMessage || "The voting session could not be loaded.";
    let sessionTitleBadge = sessionTitleFromError || (session?.title);

    if (session?.status === "draft" || session?.status === "pending_start") {
      title = "Session Not Started";
      icon = <Timer className="h-16 w-16 text-yellow-500 mx-auto mb-4" />;
      displayedMessage = errorMessage || "This voting session hasn't started yet. Please wait for the restaurant staff to begin the session.";
    } else if (session?.status === "paused") {
      title = "Session Paused";
      icon = <Timer className="h-16 w-16 text-yellow-500 mx-auto mb-4" />;
      displayedMessage = errorMessage || "This voting session is temporarily paused. Please wait for it to resume.";
    } else if (session?.status === "completed" || session?.status === "expired") {
      title = "Voting Closed";
      icon = <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />;
      displayedMessage = errorMessage || "This voting session has ended. Thank you for your interest in providing feedback.";
    }


    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
          <Card className="text-center">
            <CardContent className="pt-6">
              {icon}
              <h2 className="text-xl font-semibold mb-2">{title}</h2>
              <p className="text-muted-foreground mb-4">{displayedMessage}</p>
              {sessionTitleBadge && <Badge variant="outline" className="mb-4">{sessionTitleBadge}</Badge>}
              {session?.status === "completed" || session?.status === "expired" ? (
                <p className="text-sm text-muted-foreground">
                  Session ended at {session.end_time ? format(new Date(session.end_time), "HH:mm, MMM dd") : "N/A"}
                </p>
              ) : null}
              <Button onClick={() => router.push("/")} variant="outline" className="mt-4">
                Go Home
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // This check must come after error/loading checks, and uses session.id
  if (session && localStorage.getItem(`vote-${session.id}`)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
          <Card className="text-center">
            <CardContent className="pt-6">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Thank You!</h2>
              <p className="text-muted-foreground mb-4">
                You have already submitted your rating for this session. We appreciate your feedback!
              </p>
              <Badge variant="outline" className="mb-4">
                {session.title}
              </Badge>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Session Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-primary">{session.title}</CardTitle>
              {session.description && <CardDescription className="text-lg">{session.description}</CardDescription>}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Time Remaining */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="text-lg font-semibold">Time Remaining: {formatTimeRemaining(timeRemaining)}</span>
                  </div>
                  <Progress value={getProgressPercentage()} className="h-2" />
                </div>

                {/* Session Info */}
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Session Duration</p>
                    <p className="font-medium">{session.duration_minutes} minutes</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium capitalize">{session.status}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Voting Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <VotingForm session={session} onVoteSubmitted={() => setHasVoted(true)} />
        </motion.div>
      </div>
    </div>
  )
}
