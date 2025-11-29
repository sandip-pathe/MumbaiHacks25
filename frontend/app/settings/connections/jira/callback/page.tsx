"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function JiraCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const [message, setMessage] = useState("Connecting to Jira...");
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double execution (React StrictMode runs effects twice in dev)
    if (hasProcessed.current) return;

    if (!code) {
      router.push("/settings/connections?jira_error=no_code");
      return;
    }

    hasProcessed.current = true;

    const handleCallback = async () => {
      try {
        setMessage("Exchanging authorization code...");

        // Call backend to exchange code for token (same pattern as GitHub)
        const response = await fetch(
          `http://localhost:8000/api/jira/callback?code=${encodeURIComponent(
            code
          )}&state=${encodeURIComponent(state || "")}`
        );

        if (!response.ok) {
          const error = await response
            .json()
            .catch(() => ({ detail: "Unknown error" }));
          throw new Error(error.detail || "Failed to connect Jira");
        }

        const data = await response.json();
        setMessage(`Connected to ${data.site_name}!`);

        // Redirect to success page
        setTimeout(() => {
          router.push("/settings/connections?jira_connected=true");
        }, 500);
      } catch (err) {
        console.error("Jira callback error:", err);
        router.push("/settings/connections?jira_error=connection_failed");
      }
    };

    handleCallback();
  }, [code, state, router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center flex-col gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <p className="text-gray-400">{message}</p>
    </div>
  );
}
