"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import LanguageSelector from "@/components/language-selector"
import { Button } from "@/components/ui/button";

export default function RatingSessionPage() {
  const router = useRouter()
  const params = useParams()
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)
  const sessionId = params.sessionId as string

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // sessionId from params is actually the unique_link_slug
  const slug = params.sessionId as string;

  useEffect(() => {
    if (!slug) {
      setIsLoading(false);
      setError("No session identifier provided.");
      router.push("/"); // Or a dedicated error page
      return;
    }

    const verifySessionSlug = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/verify-vote-link/${slug}`);
        const data = await response.json();

        if (response.ok && data.isValid) {
          setIsValidSession(true);
          // Optionally, you could store session.title from data if needed by LanguageSelector or subsequent pages
          // For example, pass it via query params to the next step if LanguageSelector redirects
        } else {
          setIsValidSession(false);
          setError(data.error || "Invalid or expired session.");
          // Redirect to home or a more specific error page based on status
          // For now, keeping the redirect to home for simplicity on error
          router.push("/");
        }
      } catch (err) {
        console.error("Error verifying session slug:", err);
        setIsValidSession(false);
        setError("Failed to verify session. Please try again later.");
        router.push("/"); // Redirect on catch
      } finally {
        setIsLoading(false);
      }
    };

    verifySessionSlug();
  }, [slug, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Validating voting session...</p>
        </div>
      </div>
    );
  }

  if (error && !isValidSession) {
    // This state might be brief due to router.push("/") in useEffect's error handling.
    // However, it's good practice to have a distinct UI for it.
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <div className="text-center p-8 bg-card shadow-xl rounded-lg">
          <h2 className="text-xl font-semibold text-destructive mb-4">Session Invalid</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => router.push("/")}>Go to Homepage</Button>
        </div>
      </div>
    );
  }

  if (isValidSession) {
    // If LanguageSelector needs session details like title or ID,
    // they should be passed, possibly by fetching them again or if verify-vote-link returns them.
    // The current verify-vote-link returns { isValid: true, title: session.title, id: session.id }
    // We could pass these to LanguageSelector if needed, or it can make its own query.
    // For now, just rendering LanguageSelector as it was.
    return <LanguageSelector />;
  }

  // Fallback, though ideally, should not be reached if logic is correct
  // as other states (loading, error, valid) are handled.
  // Or if router.push has already initiated a redirect.
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redirecting...</p>
    </div>
  );
}
