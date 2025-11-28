"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Github, Loader2, Mail } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

export default function SignInPage() {
  const [activeTab, setActiveTab] = useState<"email" | "github">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const router = useRouter();
  const { setPrimaryAuth } = useAuth();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isSignUp) {
        const result = await apiClient.signup(email, password);
        setPrimaryAuth(result.access_token, email);
        router.push("/dashboard");
      } else {
        const result = await apiClient.login(email, password);
        setPrimaryAuth(result.access_token, email);
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubAuth = async () => {
    setLoading(true);
    setError("");

    try {
      const redirectUri = `${window.location.origin}/auth/github/callback`;
      const result = await apiClient.getGitHubAuthUrl(
        redirectUri,
        "primary_auth"
      );
      window.location.href = result.authorization_url;
    } catch (err: any) {
      setError(err.message || "Failed to initiate GitHub OAuth");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Anaya</h1>
          <p className="text-gray-400">AI-powered compliance automation</p>
        </div>

        {/* Auth Card */}
        <div className="bg-[#111] border border-[#333] rounded-xl p-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 p-1 bg-[#0a0a0a] rounded-lg">
            <button
              onClick={() => setActiveTab("email")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === "email"
                  ? "bg-white text-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Mail className="inline h-4 w-4 mr-2" />
              Email
            </button>
            <button
              onClick={() => setActiveTab("github")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === "github"
                  ? "bg-white text-black"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Github className="inline h-4 w-4 mr-2" />
              GitHub
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-950/30 border border-red-900/30 rounded-md">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Email/Password Form */}
          {activeTab === "email" && (
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-gray-300">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 bg-[#0a0a0a] border-[#333] text-white"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-gray-300">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 bg-[#0a0a0a] border-[#333] text-white"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black hover:bg-gray-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isSignUp ? "Creating Account..." : "Signing In..."}
                  </>
                ) : isSignUp ? (
                  "Create Account"
                ) : (
                  "Sign In"
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm text-gray-400 hover:text-white"
                >
                  {isSignUp
                    ? "Already have an account? Sign in"
                    : "Don't have an account? Sign up"}
                </button>
              </div>
            </form>
          )}

          {/* GitHub OAuth */}
          {activeTab === "github" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400 text-center mb-4">
                Sign in with your GitHub account to get started quickly
              </p>

              <Button
                onClick={handleGitHubAuth}
                disabled={loading}
                className="w-full bg-[#24292e] text-white hover:bg-[#2f363d]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  <>
                    <Github className="mr-2 h-4 w-4" />
                    Continue with GitHub
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                You'll be redirected to GitHub to authorize the app
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          By continuing, you agree to Anaya's Terms of Service and Privacy
          Policy
        </p>
      </div>
    </div>
  );
}
