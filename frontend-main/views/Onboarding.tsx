import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/Button";
import { GlassCard } from "../components/ui/GlassCard";
import {
  Github,
  CheckCircle2,
  Ticket,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";

interface OnboardingProps {
  onComplete: (data: { githubToken?: string; jiraConnected?: boolean }) => void;
}

// Internal Toast (Consistent with Auth.tsx)
interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-6 right-6 z-50 animate-fade-in-up flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md ${
        type === "success"
          ? "bg-success/10 border-success/20 text-success"
          : "bg-danger/10 border-danger/20 text-danger"
      }`}
    >
      {type === "success" ? (
        <CheckCircle size={18} />
      ) : (
        <AlertCircle size={18} />
      )}
      <span className="font-medium text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
};

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step1Complete, setStep1Complete] = useState(false);
  const [step2Complete, setStep2Complete] = useState(false);
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [githubToken, setGithubToken] = useState<string>("");

  useEffect(() => {
    // Check for OAuth callback
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");

    if (code && state) {
      if (state.startsWith("github_")) {
        handleGithubCallback(code);
      } else if (state.startsWith("jira_")) {
        handleJiraCallback(code);
      }
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleGithubCallback = async (code: string) => {
    setLoading1(true);
    try {
      const response = await fetch(
        "http://localhost:8000/user/auth/github/callback",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            redirect_uri: window.location.origin,
          }),
        }
      );

      if (!response.ok) throw new Error("GitHub auth failed");

      const data = await response.json();
      setGithubToken(data.access_token);
      setStep1Complete(true);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error("GitHub auth error:", error);
      alert("GitHub authentication failed. Please try again.");
    } finally {
      setLoading1(false);
    }
  };

  const handleJiraCallback = async (code: string) => {
    setLoading2(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/jira/callback?code=${code}&state=jira_oauth`,
        {
          method: "GET",
        }
      );

      if (!response.ok) throw new Error("Jira auth failed");

      const data = await response.json();
      if (data.success) {
        setStep2Complete(true);
        setShowToast(true);
        setTimeout(() => {
          onComplete({ githubToken, jiraConnected: true });
        }, 2000);
      }
    } catch (error) {
      console.error("Jira auth error:", error);
      alert("Jira authentication failed. Please try again.");
    } finally {
      setLoading2(false);
    }
  };

  const handleConnectGithub = async () => {
    setLoading1(true);
    try {
      // Initiate GitHub OAuth
      const state = `github_${Math.random().toString(36).substring(7)}`;
      const redirectUri = window.location.origin;
      const clientId = "Ov23ligCmcdoJjhBcwJr"; // Your GitHub OAuth App client ID

      const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&state=${state}&scope=repo%20user`;

      window.location.href = authUrl;
    } catch (error) {
      console.error("GitHub auth error:", error);
      setLoading1(false);
    }
  };

  const handleConnectJira = async () => {
    setLoading2(true);
    try {
      // Get Jira OAuth URL from backend
      const response = await fetch("http://localhost:8000/api/jira/connect");
      const data = await response.json();

      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      }
    } catch (error) {
      console.error("Jira auth error:", error);
      setLoading2(false);
    }
  };

  const handleSkipJira = () => {
    // Allow skipping Jira and going to repo selection
    onComplete({ githubToken, jiraConnected: false });
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-bgMain p-6">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-accent2/10 rounded-full blur-[120px]" />

      {showToast && (
        <Toast
          message="Onboarding complete! Your environment is ready for automated compliance."
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}

      <div className="max-w-5xl w-full relative z-10 space-y-12 animate-fade-in-up">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white">
            Setup Environment
          </h2>
          <p className="text-accent3">
            Connect your tools to enable automated compliance agents.
          </p>
        </div>

        {/* Steps Visualizer */}
        <div className="flex items-center justify-center gap-4 relative">
          {/* Connecting Line Background */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[2px] bg-white/10 z-0"></div>
          {/* Connecting Line Active (Animated) */}
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-primary to-accent1 z-0 transition-all duration-1000 ease-out ${
              step1Complete ? "w-[200px] opacity-100" : "w-0 opacity-0"
            }`}
          ></div>

          {/* Step 1 Bubble */}
          <div
            className={`relative z-10 px-4 py-1.5 rounded-full text-xs font-bold font-heading border transition-all duration-300 ${
              step1Complete
                ? "bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(255,107,155,0.4)]"
                : "bg-bgCard border-white/20 text-accent3"
            }`}
          >
            Step 1
          </div>

          {/* Step 2 Bubble */}
          <div
            className={`relative z-10 px-4 py-1.5 rounded-full text-xs font-bold font-heading border transition-all duration-300 ${
              step2Complete
                ? "bg-accent1/20 border-accent1 text-accent1 shadow-[0_0_15px_rgba(0,245,212,0.4)]"
                : step1Complete
                ? "bg-bgCard border-white/40 text-white"
                : "bg-bgCard border-white/10 text-accent3 opacity-50"
            }`}
          >
            Step 2
          </div>
        </div>

        {/* Cards Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          {/* Step 1: GitHub */}
          <GlassCard
            className={`flex flex-col items-center text-center p-8 transition-all duration-500 ${
              step1Complete
                ? "border-primary/50 shadow-[0_0_30px_rgba(255,107,155,0.1)]"
                : ""
            }`}
          >
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${
                step1Complete
                  ? "bg-gradient-to-br from-primary to-secondary text-bgMain shadow-lg scale-110"
                  : "bg-white/5 border border-white/10 text-white"
              }`}
            >
              <Github size={32} />
            </div>

            <h3 className="text-xl font-heading font-bold text-white mb-2">
              Connect Codebase
            </h3>
            <p className="text-sm text-accent3 mb-8 h-10">
              Select a repository to begin automated compliance scanning.
            </p>

            {step1Complete ? (
              <div className="mt-auto px-4 py-2 bg-success/10 border border-success/20 rounded-full flex items-center gap-2 text-success font-medium text-sm animate-fade-in-up">
                <CheckCircle2 size={16} />
                GitHub Connected
              </div>
            ) : (
              <Button
                onClick={handleConnectGithub}
                disabled={loading1}
                className="mt-auto w-full"
              >
                {loading1 ? "Connecting..." : "Connect to GitHub"}
              </Button>
            )}
          </GlassCard>

          {/* Step 2: Jira */}
          <GlassCard
            className={`flex flex-col items-center text-center p-8 transition-all duration-500 ${
              !step1Complete ? "opacity-50 grayscale pointer-events-none" : ""
            } ${
              step2Complete
                ? "border-accent1/50 shadow-[0_0_30px_rgba(0,245,212,0.1)]"
                : ""
            }`}
          >
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${
                step2Complete
                  ? "bg-gradient-to-br from-accent1 to-blue-400 text-bgMain shadow-lg scale-110"
                  : "bg-white/5 border border-white/10 text-white"
              }`}
            >
              <Ticket size={32} />
            </div>

            <h3 className="text-xl font-heading font-bold text-white mb-2">
              Jira Connection
            </h3>
            <p className="text-sm text-accent3 mb-8 h-10">
              Connect your Jira workspace to enable automated ticket creation.
            </p>

            {step2Complete ? (
              <div className="mt-auto px-4 py-2 bg-success/10 border border-success/20 rounded-full flex items-center gap-2 text-success font-medium text-sm animate-fade-in-up">
                <CheckCircle2 size={16} />
                Jira Connected
              </div>
            ) : (
              <div className="mt-auto w-full space-y-3">
                <Button
                  onClick={handleConnectJira}
                  disabled={loading2 || !step1Complete}
                  variant={step1Complete ? "primary" : "secondary"}
                  className="w-full"
                >
                  {loading2 ? "Connecting..." : "Connect to Jira"}
                </Button>
                {step1Complete && (
                  <button
                    onClick={handleSkipJira}
                    className="w-full text-sm text-accent3 hover:text-white transition-colors"
                  >
                    Skip for now
                  </button>
                )}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
