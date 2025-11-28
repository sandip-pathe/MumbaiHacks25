// frontend/app/auth/github/callback/page.tsx
"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

export default function GitHubCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const { setPrimaryAuth, setGitHubConnection } = useAuth();
  const [message, setMessage] = useState("Connecting to GitHub...");
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double execution (React StrictMode runs effects twice in dev)
    if (hasProcessed.current) return;

    if (!code) {
      router.push("/auth/signin?error=no_code");
      return;
    }

    hasProcessed.current = true;

    const handleCallback = async () => {
      try {
        const redirectUri = `${window.location.origin}/auth/github/callback`;

        if (state === "primary_auth") {
          // Primary authentication via GitHub OAuth
          setMessage("Authenticating with GitHub...");
          const data = await apiClient.exchangeGitHubCode(code, redirectUri);
          setPrimaryAuth(data.access_token, data.user.email || data.user.login);
          router.push("/dashboard");
        } else if (state === "github_connection") {
          // GitHub connection for repo access (secondary)
          setMessage("Connecting GitHub account...");
          const data = await apiClient.connectGitHub(code, redirectUri);
          setGitHubConnection(data.access_token);
          router.push("/settings/connections?success=github");
        } else {
          // Default: treat as primary auth
          setMessage("Authenticating with GitHub...");
          const data = await apiClient.exchangeGitHubCode(code, redirectUri);
          setPrimaryAuth(data.access_token, data.user.email || data.user.login);
          router.push("/dashboard");
        }
      } catch (err) {
        console.error("GitHub callback error:", err);
        router.push("/auth/signin?error=github_auth_failed");
      }
    };

    handleCallback();
  }, [code, state, router, setPrimaryAuth, setGitHubConnection]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center flex-col gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <p className="text-gray-400">{message}</p>
    </div>
  );
}
